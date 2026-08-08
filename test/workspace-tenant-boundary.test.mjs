import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  requireMatchingWorkspace,
  requireWorkspaceId,
  withWorkspaceTransaction
} from "../workspace-tenant-boundary.js";
import {
  ALPHA_WORKSPACE_ID,
  BRAVO_WORKSPACE_ID,
  workspaceRows
} from "../test-support/workspace-tenants.mjs";

const migrationUrl = new URL("../db/migrations/001_workspace_foundation.sql", import.meta.url);

function createDatabaseRecorder() {
  const calls = [];
  return {
    calls,
    async transaction(operation) {
      calls.push({ type: "begin" });
      const result = await operation({
        async query(text, parameters) {
          calls.push({ type: "query", text, parameters });
          return { rows: [] };
        }
      });
      calls.push({ type: "commit" });
      return result;
    }
  };
}

test("requires a canonical UUID before opening a workspace transaction", async () => {
  assert.equal(requireWorkspaceId(ALPHA_WORKSPACE_ID), ALPHA_WORKSPACE_ID);
  assert.throws(() => requireWorkspaceId("alpha"), /valid authorized workspace ID/);
  assert.throws(() => requireWorkspaceId(undefined), /valid authorized workspace ID/);
});

test("binds the authorized workspace as transaction-local database context", async () => {
  const database = createDatabaseRecorder();

  const result = await withWorkspaceTransaction(database, ALPHA_WORKSPACE_ID, async (scope) => {
    assert.equal(scope.workspaceId, ALPHA_WORKSPACE_ID);
    await scope.query("SELECT id FROM app_identity.collection_rounds");
    return "complete";
  });

  assert.equal(result, "complete");
  assert.deepEqual(database.calls[1], {
    type: "query",
    text: "SELECT set_config('app.workspace_id', $1, true)",
    parameters: [ALPHA_WORKSPACE_ID]
  });
  assert.equal(database.calls.at(-1).type, "commit");
});

test("denies records belonging to a second workspace", () => {
  const alphaScope = { workspaceId: ALPHA_WORKSPACE_ID };
  const alphaRecord = workspaceRows.find((row) => row.workspace_id === ALPHA_WORKSPACE_ID);
  const bravoRecord = workspaceRows.find((row) => row.workspace_id === BRAVO_WORKSPACE_ID);

  assert.equal(requireMatchingWorkspace(alphaScope, alphaRecord), alphaRecord);
  assert.throws(
    () => requireMatchingWorkspace(alphaScope, bravoRecord),
    /Workspace access denied/
  );
  assert.throws(
    () => requireMatchingWorkspace({ workspaceId: BRAVO_WORKSPACE_ID }, alphaRecord),
    /Workspace access denied/
  );
});

test("migration enables and forces RLS for every tenant table", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  const tenantTables = [
    "app_identity.workspaces",
    "app_identity.collection_rounds",
    "app_identity.participant_slots",
    "app_private.submissions",
    "app_shared.organizational_aggregates",
    "app_operations.audit_events"
  ];

  for (const table of tenantTables) {
    assert.match(sql, new RegExp(`ALTER TABLE ${table.replace(".", "\\.")} ENABLE ROW LEVEL SECURITY`));
    assert.match(sql, new RegExp(`ALTER TABLE ${table.replace(".", "\\.")} FORCE ROW LEVEL SECURITY`));
  }
  assert.equal((sql.match(/CREATE POLICY /g) || []).length, tenantTables.length);
});

test("collection setup migration adds a bounded round label", async () => {
  const migration = await readFile(
    new URL("../db/migrations/004_collection_round_setup.sql", import.meta.url),
    "utf8"
  );
  assert.match(migration, /ADD COLUMN display_label text/);
  assert.match(migration, /ALTER COLUMN display_label SET NOT NULL/);
  assert.match(migration, /char_length\(display_label\) BETWEEN 3 AND 120/);
});

test("shared action-cycle migration is tenant-isolated and threshold-linked", async () => {
  const migration = await readFile(
    new URL("../db/migrations/005_shared_action_cycles.sql", import.meta.url),
    "utf8"
  );
  assert.match(migration, /CREATE TABLE app_shared\.action_cycles/);
  assert.match(migration, /ALTER TABLE app_shared\.action_cycles ENABLE ROW LEVEL SECURITY/);
  assert.match(migration, /ALTER TABLE app_shared\.action_cycles FORCE ROW LEVEL SECURITY/);
  assert.match(migration, /CREATE POLICY action_cycle_tenant_policy/);
  assert.match(
    migration,
    /FOREIGN KEY \(workspace_id, round_id\)\s+REFERENCES app_identity\.collection_rounds\(workspace_id, id\)/
  );
  assert.match(migration, /GRANT SELECT, INSERT, UPDATE, DELETE\s+ON app_shared\.action_cycles/);
});

test("only one organizational action cycle can remain open per round", async () => {
  const migration = await readFile(
    new URL("../db/migrations/006_single_active_action_cycle.sql", import.meta.url),
    "utf8"
  );
  assert.match(migration, /CREATE UNIQUE INDEX action_cycles_one_open_per_round_idx/);
  assert.match(migration, /ON app_shared\.action_cycles\(workspace_id, round_id\)/);
  assert.match(migration, /WHERE status IN \('planned', 'active'\)/);
});

test("linked reassessment rounds preserve tenant ownership and one follow-up chain", async () => {
  const migration = await readFile(
    new URL("../db/migrations/007_linked_reassessment_rounds.sql", import.meta.url),
    "utf8"
  );
  assert.match(migration, /ADD COLUMN prior_round_id uuid/);
  assert.match(
    migration,
    /FOREIGN KEY \(workspace_id, prior_round_id\)\s+REFERENCES app_identity\.collection_rounds\(workspace_id, id\)/
  );
  assert.match(migration, /CREATE UNIQUE INDEX collection_rounds_one_follow_up_idx/);
});

test("tenant-owned relationships use composite workspace foreign keys", async () => {
  const sql = await readFile(migrationUrl, "utf8");

  assert.match(
    sql,
    /FOREIGN KEY \(workspace_id, round_id\)\s+REFERENCES app_identity\.collection_rounds\(workspace_id, id\)/g
  );
  assert.match(
    sql,
    /FOREIGN KEY \(workspace_id, submission_id\)\s+REFERENCES app_private\.submissions\(workspace_id, id\)/
  );
  assert.doesNotMatch(sql, /REFERENCES app_private\.submissions\(id\)/);
});

test("diagnostic platform foundation isolates every record by workspace", async () => {
  const migration = await readFile(
    new URL("../db/migrations/008_diagnostic_platform_foundation.sql", import.meta.url),
    "utf8"
  );
  const tenantTables = [
    "app_shared.diagnostics",
    "app_private.diagnostic_context_briefs",
    "app_identity.diagnostic_participant_slots",
    "app_shared.diagnostic_protocols",
    "app_private.diagnostic_interviews",
    "app_private.diagnostic_evidence",
    "app_shared.diagnostic_findings",
    "app_shared.commercial_entitlements",
    "app_shared.diagnostic_interventions"
  ];
  for (const table of tenantTables) {
    const escaped = table.replace(".", "\\.");
    assert.match(migration, new RegExp(`ALTER TABLE ${escaped} ENABLE ROW LEVEL SECURITY`));
    assert.match(migration, new RegExp(`ALTER TABLE ${escaped} FORCE ROW LEVEL SECURITY`));
  }
  assert.equal((migration.match(/CREATE POLICY /g) || []).length, tenantTables.length);
  assert.equal((migration.match(/PRIMARY KEY \(workspace_id, id\)/g) || []).length, tenantTables.length);
});

test("diagnostic confidentiality and entitlement boundaries are structural", async () => {
  const migration = await readFile(
    new URL("../db/migrations/008_diagnostic_platform_foundation.sql", import.meta.url),
    "utf8"
  );
  assert.match(migration, /CREATE TABLE app_identity\.diagnostic_participant_slots/);
  assert.match(migration, /CREATE TABLE app_private\.diagnostic_interviews/);
  assert.match(migration, /encrypted_response_payload bytea/);
  assert.match(migration, /status <> 'withdrawn' OR encrypted_response_payload IS NULL/);
  assert.match(migration, /disclosure_risk <> 'high' OR review_status = 'pending' OR reviewed_by_type = 'human'/);
  assert.match(migration, /CREATE TABLE app_shared\.commercial_entitlements/);
  assert.match(migration, /payment_provider_ref text/);
  assert.doesNotMatch(migration, /card_number|card_last_four|payment_method|partner_revenue/i);
});

test("diagnostic relationships cannot cross workspace boundaries", async () => {
  const migration = await readFile(
    new URL("../db/migrations/008_diagnostic_platform_foundation.sql", import.meta.url),
    "utf8"
  );
  assert.match(migration, /FOREIGN KEY \(workspace_id, participant_slot_id\)\s+REFERENCES app_identity\.diagnostic_participant_slots\(workspace_id, id\)/);
  assert.match(migration, /FOREIGN KEY \(workspace_id, source_interview_id\)\s+REFERENCES app_private\.diagnostic_interviews\(workspace_id, id\)/);
  assert.match(migration, /FOREIGN KEY \(workspace_id, finding_id\)\s+REFERENCES app_shared\.diagnostic_findings\(workspace_id, id\)/);
  assert.match(migration, /FOREIGN KEY \(workspace_id, entitlement_id\)\s+REFERENCES app_shared\.commercial_entitlements\(workspace_id, id\)/);
  const singleColumnReferences = migration.match(/REFERENCES app_(?:identity|private|shared)\.[a-z_]+\(id\)/g) || [];
  assert.deepEqual(singleColumnReferences, ["REFERENCES app_identity.workspaces(id)"]);
});

test("diagnostic review-state alignment is a forward-only migration", async () => {
  const migration = await readFile(
    new URL("../db/migrations/009_align_diagnostic_review_state.sql", import.meta.url),
    "utf8"
  );
  assert.match(migration, /DROP CONSTRAINT diagnostics_human_review_status_check/);
  assert.match(migration, /CHECK \(human_review_status IN \('clear', 'required', 'in-review', 'resolved'\)\)/);
  assert.match(migration, /SET human_review_status = 'clear'/);
  assert.match(migration, /WHERE human_review_status = 'not-required'/);
});

test("diagnostic participant plans remain identity-free and tenant-isolated", async () => {
  const migration = await readFile(
    new URL("../db/migrations/010_diagnostic_participant_plans.sql", import.meta.url),
    "utf8"
  );
  assert.match(migration, /CREATE TABLE app_private\.diagnostic_participant_plans/);
  assert.match(migration, /FOREIGN KEY \(workspace_id, diagnostic_id\)\s+REFERENCES app_shared\.diagnostics\(workspace_id, id\)/);
  assert.match(migration, /ENABLE ROW LEVEL SECURITY/);
  assert.match(migration, /FORCE ROW LEVEL SECURITY/);
  assert.match(migration, /CREATE POLICY diagnostic_participant_plan_tenant_policy/);
  assert.doesNotMatch(migration, /participant_name|participant_email|invitation_digest/);
});

test("diagnostic invitation links bind identity slots to approved plan slots", async () => {
  const migration = await readFile(new URL("../db/migrations/011_diagnostic_participant_invitation_links.sql", import.meta.url), "utf8");
  assert.match(migration, /ADD COLUMN plan_slot_id text/);
  assert.match(migration, /ADD COLUMN clerk_invitation_id text/);
  assert.match(migration, /diagnostic_participant_plan_slot_idx/);
  assert.match(migration, /diagnostic_participant_invitation_idx/);
  assert.doesNotMatch(migration, /email_address|response_payload|interview_text/);
});

test("diagnostic advisor evidence review is assignment-scoped and tenant-isolated", async () => {
  const migration = await readFile(new URL("../db/migrations/012_diagnostic_advisor_evidence_review.sql", import.meta.url), "utf8");
  assert.match(migration, /CREATE TABLE app_operations\.diagnostic_advisor_assignments/);
  assert.match(migration, /advisor_clerk_user_id text NOT NULL/);
  assert.match(migration, /expires_at timestamptz NOT NULL/);
  assert.match(migration, /FOREIGN KEY \(workspace_id, diagnostic_id\)\s+REFERENCES app_shared\.diagnostics\(workspace_id, id\)/);
  assert.match(migration, /ENABLE ROW LEVEL SECURITY/);
  assert.match(migration, /FORCE ROW LEVEL SECURITY/);
  assert.match(migration, /CREATE POLICY diagnostic_advisor_assignment_tenant_policy/);
  assert.match(migration, /ADD COLUMN reviewed_by_clerk_user_id text/);
});

test("Diagnostic Frame v2 persistence is additive, tenant-isolated, and bound to one diagnostic", async () => {
  const migration = await readFile(new URL("../db/migrations/035_diagnostic_frame_v2_foundation.sql", import.meta.url), "utf8");
  assert.match(migration, /CREATE TABLE app_private\.diagnostic_frames_v2/);
  assert.match(migration, /CREATE TABLE app_shared\.diagnostic_protocols_v2/);
  assert.match(migration, /CREATE TABLE app_private\.diagnostic_typed_evidence_v2/);
  assert.match(migration, /UNIQUE \(workspace_id,diagnostic_id\)/);
  assert.match(migration, /FOREIGN KEY \(workspace_id,diagnostic_id,frame_id\)/);
  assert.match(migration, /ENABLE ROW LEVEL SECURITY/g);
  assert.match(migration, /FORCE ROW LEVEL SECURITY/g);
  assert.match(migration, /app_identity\.current_workspace_id\(\)/);
  assert.doesNotMatch(migration, /ALTER TABLE app_private\.diagnostic_context_briefs|ALTER TABLE app_shared\.diagnostic_protocols\s/);
});

test("v2 interview collection is encrypted, tenant-isolated, and leaves v1 storage unchanged", async () => {
  const migration=await readFile(new URL("../db/migrations/036_diagnostic_interviews_v2.sql",import.meta.url),"utf8");
  assert.match(migration,/CREATE TABLE app_private\.diagnostic_interviews_v2/);
  assert.match(migration,/REFERENCES app_shared\.diagnostic_protocols_v2\(workspace_id,diagnostic_id,id\)/);
  assert.match(migration,/REFERENCES app_identity\.diagnostic_participant_slots\(workspace_id,diagnostic_id,id\)/);
  assert.match(migration,/encrypted_response_payload bytea/);
  assert.match(migration,/status = 'withdrawn'.*encrypted_response_payload IS NULL/s);
  assert.match(migration,/ENABLE ROW LEVEL SECURITY/);assert.match(migration,/FORCE ROW LEVEL SECURITY/);
  assert.doesNotMatch(migration,/ALTER TABLE app_private\.diagnostic_interviews\s/);
});
