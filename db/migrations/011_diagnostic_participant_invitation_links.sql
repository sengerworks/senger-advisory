ALTER TABLE app_identity.diagnostic_participant_slots
  ADD COLUMN plan_slot_id text,
  ADD COLUMN clerk_invitation_id text;

CREATE UNIQUE INDEX diagnostic_participant_plan_slot_idx
  ON app_identity.diagnostic_participant_slots(workspace_id, diagnostic_id, plan_slot_id)
  WHERE plan_slot_id IS NOT NULL;

CREATE UNIQUE INDEX diagnostic_participant_invitation_idx
  ON app_identity.diagnostic_participant_slots(workspace_id, clerk_invitation_id)
  WHERE clerk_invitation_id IS NOT NULL;

ALTER TABLE app_identity.diagnostic_participant_slots
  ADD CONSTRAINT diagnostic_participant_plan_slot_format
  CHECK (plan_slot_id IS NULL OR char_length(plan_slot_id) BETWEEN 1 AND 100),
  ADD CONSTRAINT diagnostic_participant_invitation_format
  CHECK (clerk_invitation_id IS NULL OR clerk_invitation_id ~ '^orginv_[A-Za-z0-9]+$');
