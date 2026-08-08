ALTER TABLE app_identity.diagnostic_participant_slots
  ADD CONSTRAINT diagnostic_participant_slots_v2_identity UNIQUE (workspace_id,diagnostic_id,id);
ALTER TABLE app_shared.diagnostic_protocols_v2
  ADD CONSTRAINT diagnostic_protocols_v2_identity UNIQUE (workspace_id,diagnostic_id,id);

CREATE TABLE app_private.diagnostic_interviews_v2 (
  id uuid NOT NULL DEFAULT gen_random_uuid(), workspace_id uuid NOT NULL, diagnostic_id uuid NOT NULL,
  participant_slot_id uuid NOT NULL, protocol_id uuid NOT NULL,
  interview_version text NOT NULL CHECK (interview_version = '2.0.0'),
  collection_mode text NOT NULL CHECK (collection_mode IN ('automated-written','advisor-live')),
  status text NOT NULL CHECK (status IN ('in-progress','submitted','withdrawn','review-required','evidence-ready')),
  encryption_version text NOT NULL, encryption_key_ref text NOT NULL, encrypted_response_payload bytea,
  submitted_at timestamptz, withdrawn_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id,id), UNIQUE (workspace_id,diagnostic_id,participant_slot_id),
  FOREIGN KEY (workspace_id,diagnostic_id) REFERENCES app_shared.diagnostics(workspace_id,id) ON DELETE CASCADE,
  FOREIGN KEY (workspace_id,diagnostic_id,participant_slot_id) REFERENCES app_identity.diagnostic_participant_slots(workspace_id,diagnostic_id,id) ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id,diagnostic_id,protocol_id) REFERENCES app_shared.diagnostic_protocols_v2(workspace_id,diagnostic_id,id) ON DELETE RESTRICT,
  CHECK ((status IN ('submitted','review-required','evidence-ready')) = (submitted_at IS NOT NULL)),
  CHECK ((status = 'withdrawn') = (withdrawn_at IS NOT NULL)),
  CHECK (status <> 'withdrawn' OR encrypted_response_payload IS NULL)
);
CREATE INDEX diagnostic_interviews_v2_collection_idx ON app_private.diagnostic_interviews_v2(workspace_id,diagnostic_id,status,updated_at);
ALTER TABLE app_private.diagnostic_interviews_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_private.diagnostic_interviews_v2 FORCE ROW LEVEL SECURITY;
CREATE POLICY diagnostic_interviews_v2_tenant_policy ON app_private.diagnostic_interviews_v2
  USING (workspace_id=app_identity.current_workspace_id()) WITH CHECK (workspace_id=app_identity.current_workspace_id());
GRANT SELECT,INSERT,UPDATE ON app_private.diagnostic_interviews_v2 TO capacity_workspace_app;
