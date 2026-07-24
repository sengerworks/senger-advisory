ALTER TABLE app_identity.collection_rounds
  ADD COLUMN prior_round_id uuid;

ALTER TABLE app_identity.collection_rounds
  ADD CONSTRAINT collection_round_prior_round_fk
  FOREIGN KEY (workspace_id, prior_round_id)
  REFERENCES app_identity.collection_rounds(workspace_id, id)
  ON DELETE RESTRICT;

CREATE UNIQUE INDEX collection_rounds_one_follow_up_idx
  ON app_identity.collection_rounds(workspace_id, prior_round_id)
  WHERE prior_round_id IS NOT NULL;
