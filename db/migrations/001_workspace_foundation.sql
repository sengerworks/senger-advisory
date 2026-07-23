CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA IF NOT EXISTS app_identity;
CREATE SCHEMA IF NOT EXISTS app_private;
CREATE SCHEMA IF NOT EXISTS app_shared;
CREATE SCHEMA IF NOT EXISTS app_operations;

CREATE FUNCTION app_identity.current_workspace_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.workspace_id', true), '')::uuid
$$;

CREATE TABLE app_identity.workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_organization_id text NOT NULL UNIQUE,
  display_label text NOT NULL CHECK (char_length(display_label) BETWEEN 1 AND 120),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'deleting')),
  created_by_clerk_user_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE app_identity.collection_rounds (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES app_identity.workspaces(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'closed')),
  assessment_version text NOT NULL,
  scoring_version text NOT NULL,
  notice_version text NOT NULL,
  minimum_participants integer NOT NULL DEFAULT 5 CHECK (minimum_participants >= 5),
  opens_at timestamptz,
  closes_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, id),
  CHECK (closes_at IS NULL OR opens_at IS NULL OR closes_at > opens_at)
);

CREATE TABLE app_identity.participant_slots (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  round_id uuid NOT NULL,
  clerk_user_id text NOT NULL,
  invitation_digest text,
  submission_id uuid,
  notice_accepted_at timestamptz,
  notice_version text,
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  PRIMARY KEY (workspace_id, id),
  UNIQUE (workspace_id, round_id, clerk_user_id),
  UNIQUE (workspace_id, submission_id),
  FOREIGN KEY (workspace_id, round_id)
    REFERENCES app_identity.collection_rounds(workspace_id, id) ON DELETE CASCADE,
  CHECK ((notice_accepted_at IS NULL) = (notice_version IS NULL))
);

CREATE TABLE app_private.submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  round_id uuid NOT NULL,
  completed_at timestamptz NOT NULL,
  assessment_version text NOT NULL,
  scoring_version text NOT NULL,
  domain_scores jsonb NOT NULL,
  overall_index integer NOT NULL CHECK (overall_index BETWEEN 0 AND 100),
  interpretation_band text NOT NULL,
  primary_constraint_ids jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  replaced_at timestamptz,
  deleted_at timestamptz,
  PRIMARY KEY (workspace_id, id),
  FOREIGN KEY (workspace_id, round_id)
    REFERENCES app_identity.collection_rounds(workspace_id, id) ON DELETE CASCADE,
  CHECK (jsonb_typeof(domain_scores) = 'object'),
  CHECK (jsonb_typeof(primary_constraint_ids) = 'array')
);

ALTER TABLE app_identity.participant_slots
  ADD CONSTRAINT participant_slots_submission_fk
  FOREIGN KEY (workspace_id, submission_id)
  REFERENCES app_private.submissions(workspace_id, id)
  DEFERRABLE INITIALLY DEFERRED;

CREATE TABLE app_shared.organizational_aggregates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  round_id uuid NOT NULL,
  aggregation_version text NOT NULL,
  participant_count integer NOT NULL CHECK (participant_count >= 0),
  minimum_required integer NOT NULL CHECK (minimum_required >= 5),
  result_policy text NOT NULL CHECK (result_policy IN ('suppressed', 'incompatible-versions', 'aggregate')),
  aggregate_payload jsonb,
  generated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, id),
  UNIQUE (workspace_id, round_id, aggregation_version),
  FOREIGN KEY (workspace_id, round_id)
    REFERENCES app_identity.collection_rounds(workspace_id, id) ON DELETE CASCADE,
  CHECK (
    (result_policy = 'aggregate' AND participant_count >= minimum_required AND aggregate_payload IS NOT NULL)
    OR
    (result_policy <> 'aggregate' AND aggregate_payload IS NULL)
  )
);

CREATE TABLE app_operations.audit_events (
  id bigint GENERATED ALWAYS AS IDENTITY,
  workspace_id uuid NOT NULL REFERENCES app_identity.workspaces(id) ON DELETE CASCADE,
  actor_clerk_user_id text,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id uuid,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  request_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (workspace_id, id),
  CHECK (jsonb_typeof(metadata) = 'object'),
  CHECK (NOT (metadata ?| ARRAY[
    'answers', 'domainScores', 'overallIndex', 'primaryConstraintIds',
    'email', 'invitationToken', 'recoverySecret'
  ]))
);

CREATE INDEX collection_rounds_workspace_status_idx
  ON app_identity.collection_rounds(workspace_id, status);
CREATE INDEX participant_slots_workspace_round_idx
  ON app_identity.participant_slots(workspace_id, round_id);
CREATE INDEX submissions_workspace_round_active_idx
  ON app_private.submissions(workspace_id, round_id)
  WHERE deleted_at IS NULL;
CREATE INDEX audit_events_workspace_occurred_idx
  ON app_operations.audit_events(workspace_id, occurred_at DESC);

ALTER TABLE app_identity.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_identity.collection_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_identity.participant_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_private.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_shared.organizational_aggregates ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_operations.audit_events ENABLE ROW LEVEL SECURITY;

ALTER TABLE app_identity.workspaces FORCE ROW LEVEL SECURITY;
ALTER TABLE app_identity.collection_rounds FORCE ROW LEVEL SECURITY;
ALTER TABLE app_identity.participant_slots FORCE ROW LEVEL SECURITY;
ALTER TABLE app_private.submissions FORCE ROW LEVEL SECURITY;
ALTER TABLE app_shared.organizational_aggregates FORCE ROW LEVEL SECURITY;
ALTER TABLE app_operations.audit_events FORCE ROW LEVEL SECURITY;

CREATE POLICY workspace_tenant_policy ON app_identity.workspaces
  USING (id = app_identity.current_workspace_id())
  WITH CHECK (id = app_identity.current_workspace_id());
CREATE POLICY collection_round_tenant_policy ON app_identity.collection_rounds
  USING (workspace_id = app_identity.current_workspace_id())
  WITH CHECK (workspace_id = app_identity.current_workspace_id());
CREATE POLICY participant_slot_tenant_policy ON app_identity.participant_slots
  USING (workspace_id = app_identity.current_workspace_id())
  WITH CHECK (workspace_id = app_identity.current_workspace_id());
CREATE POLICY submission_tenant_policy ON app_private.submissions
  USING (workspace_id = app_identity.current_workspace_id())
  WITH CHECK (workspace_id = app_identity.current_workspace_id());
CREATE POLICY aggregate_tenant_policy ON app_shared.organizational_aggregates
  USING (workspace_id = app_identity.current_workspace_id())
  WITH CHECK (workspace_id = app_identity.current_workspace_id());
CREATE POLICY audit_tenant_policy ON app_operations.audit_events
  USING (workspace_id = app_identity.current_workspace_id())
  WITH CHECK (workspace_id = app_identity.current_workspace_id());
