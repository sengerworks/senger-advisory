CREATE TABLE app_shared.diagnostics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES app_identity.workspaces(id) ON DELETE CASCADE,
  lifecycle_version text NOT NULL,
  method_version text NOT NULL,
  delivery_route text NOT NULL CHECK (delivery_route IN ('automated', 'advisor-led')),
  entitlement_type text NOT NULL CHECK (entitlement_type IN ('paid', 'poc')),
  state text NOT NULL CHECK (state IN (
    'draft', 'discovery', 'participant-design', 'protocol-review', 'collecting',
    'evidence-review', 'synthesis', 'leadership-validation', 'intervention-proposed',
    'intervention-accepted', 'active-intervention', 'reassessment', 'completed'
  )),
  human_review_status text NOT NULL DEFAULT 'not-required' CHECK (
    human_review_status IN ('not-required', 'required', 'in-review', 'resolved')
  ),
  created_by_clerk_user_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  PRIMARY KEY (workspace_id, id),
  CHECK ((state = 'completed') = (completed_at IS NOT NULL))
);

CREATE TABLE app_private.diagnostic_context_briefs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  diagnostic_id uuid NOT NULL,
  discovery_version text NOT NULL,
  approved_payload jsonb NOT NULL CHECK (jsonb_typeof(approved_payload) = 'object'),
  approved_by_clerk_user_id text NOT NULL,
  approved_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, id),
  UNIQUE (workspace_id, diagnostic_id),
  FOREIGN KEY (workspace_id, diagnostic_id)
    REFERENCES app_shared.diagnostics(workspace_id, id) ON DELETE CASCADE
);

CREATE TABLE app_identity.diagnostic_participant_slots (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  diagnostic_id uuid NOT NULL,
  clerk_user_id text,
  invitation_digest text,
  perspective_objectives jsonb NOT NULL CHECK (jsonb_typeof(perspective_objectives) = 'array'),
  notice_version text,
  notice_accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, id),
  UNIQUE (workspace_id, diagnostic_id, clerk_user_id),
  FOREIGN KEY (workspace_id, diagnostic_id)
    REFERENCES app_shared.diagnostics(workspace_id, id) ON DELETE CASCADE,
  CHECK ((notice_version IS NULL) = (notice_accepted_at IS NULL)),
  CHECK (clerk_user_id IS NOT NULL OR invitation_digest IS NOT NULL)
);

CREATE TABLE app_shared.diagnostic_protocols (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  diagnostic_id uuid NOT NULL,
  protocol_version text NOT NULL,
  question_library_version text NOT NULL,
  governed_questions jsonb NOT NULL CHECK (jsonb_typeof(governed_questions) = 'array'),
  approval_note text NOT NULL CHECK (char_length(approval_note) BETWEEN 1 AND 500),
  approved_by_clerk_user_id text NOT NULL,
  approved_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, id),
  UNIQUE (workspace_id, diagnostic_id),
  FOREIGN KEY (workspace_id, diagnostic_id)
    REFERENCES app_shared.diagnostics(workspace_id, id) ON DELETE CASCADE,
  CHECK (jsonb_array_length(governed_questions) = 15)
);

CREATE TABLE app_private.diagnostic_interviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  diagnostic_id uuid NOT NULL,
  participant_slot_id uuid NOT NULL,
  protocol_id uuid NOT NULL,
  collection_mode text NOT NULL CHECK (collection_mode IN ('automated-written', 'advisor-live')),
  status text NOT NULL CHECK (status IN ('in-progress', 'submitted', 'withdrawn', 'review-required', 'evidence-ready')),
  encryption_version text NOT NULL,
  encryption_key_ref text NOT NULL,
  encrypted_response_payload bytea,
  submitted_at timestamptz,
  withdrawn_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, id),
  UNIQUE (workspace_id, diagnostic_id, participant_slot_id),
  FOREIGN KEY (workspace_id, diagnostic_id)
    REFERENCES app_shared.diagnostics(workspace_id, id) ON DELETE CASCADE,
  FOREIGN KEY (workspace_id, participant_slot_id)
    REFERENCES app_identity.diagnostic_participant_slots(workspace_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, protocol_id)
    REFERENCES app_shared.diagnostic_protocols(workspace_id, id) ON DELETE RESTRICT,
  CHECK ((status IN ('submitted', 'review-required', 'evidence-ready')) = (submitted_at IS NOT NULL)),
  CHECK ((status = 'withdrawn') = (withdrawn_at IS NOT NULL)),
  CHECK (status <> 'withdrawn' OR encrypted_response_payload IS NULL)
);

CREATE TABLE app_private.diagnostic_evidence (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  diagnostic_id uuid NOT NULL,
  source_interview_id uuid NOT NULL,
  source_question_id text NOT NULL,
  evidence_version text NOT NULL,
  deidentified_text text NOT NULL CHECK (char_length(deidentified_text) BETWEEN 20 AND 3000),
  redaction_categories jsonb NOT NULL CHECK (jsonb_typeof(redaction_categories) = 'array'),
  disclosure_risk text NOT NULL CHECK (disclosure_risk IN ('low', 'medium', 'high')),
  review_status text NOT NULL CHECK (review_status IN ('pending', 'approved', 'excluded')),
  reviewed_by_type text CHECK (reviewed_by_type IN ('automated', 'human')),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, id),
  FOREIGN KEY (workspace_id, diagnostic_id)
    REFERENCES app_shared.diagnostics(workspace_id, id) ON DELETE CASCADE,
  FOREIGN KEY (workspace_id, source_interview_id)
    REFERENCES app_private.diagnostic_interviews(workspace_id, id) ON DELETE RESTRICT,
  CHECK ((review_status = 'pending') = (reviewed_at IS NULL)),
  CHECK (disclosure_risk <> 'high' OR review_status = 'pending' OR reviewed_by_type = 'human')
);

CREATE TABLE app_shared.diagnostic_findings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  diagnostic_id uuid NOT NULL,
  diagnostic_record_version text NOT NULL,
  synthesis_version text NOT NULL,
  record_payload jsonb NOT NULL CHECK (jsonb_typeof(record_payload) = 'object'),
  confidence text NOT NULL CHECK (confidence IN ('limited', 'moderate', 'strong')),
  status text NOT NULL CHECK (status IN ('draft', 'validated', 'revision-required')),
  validated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, id),
  UNIQUE (workspace_id, diagnostic_id),
  FOREIGN KEY (workspace_id, diagnostic_id)
    REFERENCES app_shared.diagnostics(workspace_id, id) ON DELETE CASCADE,
  CHECK ((status = 'validated') = (validated_at IS NOT NULL))
);

CREATE TABLE app_shared.commercial_entitlements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  diagnostic_id uuid NOT NULL,
  entitlement_kind text NOT NULL CHECK (entitlement_kind IN ('diagnostic', 'intervention', 'poc')),
  offer_ref text NOT NULL CHECK (char_length(offer_ref) BETWEEN 1 AND 120),
  payment_provider_ref text,
  status text NOT NULL CHECK (status IN ('pending', 'active', 'expired', 'revoked')),
  active_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, id),
  UNIQUE (workspace_id, diagnostic_id, entitlement_kind),
  FOREIGN KEY (workspace_id, diagnostic_id)
    REFERENCES app_shared.diagnostics(workspace_id, id) ON DELETE CASCADE,
  CHECK ((status = 'active') = (active_at IS NOT NULL)),
  CHECK (expires_at IS NULL OR active_at IS NULL OR expires_at > active_at)
);

CREATE TABLE app_shared.diagnostic_interventions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  diagnostic_id uuid NOT NULL,
  finding_id uuid NOT NULL,
  entitlement_id uuid NOT NULL,
  proposal_version text NOT NULL,
  service_route text NOT NULL CHECK (service_route IN ('platform-guided', 'advisor-guided')),
  proposal_payload jsonb NOT NULL CHECK (jsonb_typeof(proposal_payload) = 'object'),
  status text NOT NULL CHECK (status IN ('proposed', 'accepted', 'active', 'completed', 'stopped')),
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, id),
  UNIQUE (workspace_id, diagnostic_id),
  FOREIGN KEY (workspace_id, diagnostic_id)
    REFERENCES app_shared.diagnostics(workspace_id, id) ON DELETE CASCADE,
  FOREIGN KEY (workspace_id, finding_id)
    REFERENCES app_shared.diagnostic_findings(workspace_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, entitlement_id)
    REFERENCES app_shared.commercial_entitlements(workspace_id, id) ON DELETE RESTRICT,
  CHECK ((status IN ('accepted', 'active', 'completed', 'stopped')) = (accepted_at IS NOT NULL))
);

CREATE INDEX diagnostics_workspace_state_idx ON app_shared.diagnostics(workspace_id, state, updated_at DESC);
CREATE INDEX diagnostic_participants_workspace_diagnostic_idx ON app_identity.diagnostic_participant_slots(workspace_id, diagnostic_id);
CREATE INDEX diagnostic_interviews_workspace_diagnostic_idx ON app_private.diagnostic_interviews(workspace_id, diagnostic_id, status);
CREATE INDEX diagnostic_evidence_workspace_diagnostic_idx ON app_private.diagnostic_evidence(workspace_id, diagnostic_id, review_status);
CREATE INDEX diagnostic_entitlements_workspace_status_idx ON app_shared.commercial_entitlements(workspace_id, status);

ALTER TABLE app_shared.diagnostics ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_private.diagnostic_context_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_identity.diagnostic_participant_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_shared.diagnostic_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_private.diagnostic_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_private.diagnostic_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_shared.diagnostic_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_shared.commercial_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_shared.diagnostic_interventions ENABLE ROW LEVEL SECURITY;

ALTER TABLE app_shared.diagnostics FORCE ROW LEVEL SECURITY;
ALTER TABLE app_private.diagnostic_context_briefs FORCE ROW LEVEL SECURITY;
ALTER TABLE app_identity.diagnostic_participant_slots FORCE ROW LEVEL SECURITY;
ALTER TABLE app_shared.diagnostic_protocols FORCE ROW LEVEL SECURITY;
ALTER TABLE app_private.diagnostic_interviews FORCE ROW LEVEL SECURITY;
ALTER TABLE app_private.diagnostic_evidence FORCE ROW LEVEL SECURITY;
ALTER TABLE app_shared.diagnostic_findings FORCE ROW LEVEL SECURITY;
ALTER TABLE app_shared.commercial_entitlements FORCE ROW LEVEL SECURITY;
ALTER TABLE app_shared.diagnostic_interventions FORCE ROW LEVEL SECURITY;

CREATE POLICY diagnostic_tenant_policy ON app_shared.diagnostics USING (workspace_id = app_identity.current_workspace_id()) WITH CHECK (workspace_id = app_identity.current_workspace_id());
CREATE POLICY diagnostic_context_tenant_policy ON app_private.diagnostic_context_briefs USING (workspace_id = app_identity.current_workspace_id()) WITH CHECK (workspace_id = app_identity.current_workspace_id());
CREATE POLICY diagnostic_participant_tenant_policy ON app_identity.diagnostic_participant_slots USING (workspace_id = app_identity.current_workspace_id()) WITH CHECK (workspace_id = app_identity.current_workspace_id());
CREATE POLICY diagnostic_protocol_tenant_policy ON app_shared.diagnostic_protocols USING (workspace_id = app_identity.current_workspace_id()) WITH CHECK (workspace_id = app_identity.current_workspace_id());
CREATE POLICY diagnostic_interview_tenant_policy ON app_private.diagnostic_interviews USING (workspace_id = app_identity.current_workspace_id()) WITH CHECK (workspace_id = app_identity.current_workspace_id());
CREATE POLICY diagnostic_evidence_tenant_policy ON app_private.diagnostic_evidence USING (workspace_id = app_identity.current_workspace_id()) WITH CHECK (workspace_id = app_identity.current_workspace_id());
CREATE POLICY diagnostic_finding_tenant_policy ON app_shared.diagnostic_findings USING (workspace_id = app_identity.current_workspace_id()) WITH CHECK (workspace_id = app_identity.current_workspace_id());
CREATE POLICY diagnostic_entitlement_tenant_policy ON app_shared.commercial_entitlements USING (workspace_id = app_identity.current_workspace_id()) WITH CHECK (workspace_id = app_identity.current_workspace_id());
CREATE POLICY diagnostic_intervention_tenant_policy ON app_shared.diagnostic_interventions USING (workspace_id = app_identity.current_workspace_id()) WITH CHECK (workspace_id = app_identity.current_workspace_id());

GRANT SELECT, INSERT, UPDATE, DELETE ON
  app_shared.diagnostics,
  app_private.diagnostic_context_briefs,
  app_identity.diagnostic_participant_slots,
  app_shared.diagnostic_protocols,
  app_private.diagnostic_interviews,
  app_private.diagnostic_evidence,
  app_shared.diagnostic_findings,
  app_shared.commercial_entitlements,
  app_shared.diagnostic_interventions
TO capacity_workspace_app;
