ALTER TABLE app_operations.poc_change_candidates
  ADD CONSTRAINT poc_change_candidates_diagnostic_identity UNIQUE (workspace_id,diagnostic_id,id);
ALTER TABLE app_operations.poc_change_candidate_decisions
  DROP CONSTRAINT poc_change_candidate_decisions_workspace_id_candidate_id_fkey,
  ADD CONSTRAINT poc_change_candidate_decisions_diagnostic_candidate_fkey
    FOREIGN KEY (workspace_id,diagnostic_id,candidate_id)
    REFERENCES app_operations.poc_change_candidates(workspace_id,diagnostic_id,id) ON DELETE CASCADE;
ALTER TABLE app_operations.poc_change_candidate_validations
  DROP CONSTRAINT poc_change_candidate_validations_workspace_id_candidate_id_fkey,
  ADD CONSTRAINT poc_change_candidate_validations_diagnostic_candidate_fkey
    FOREIGN KEY (workspace_id,diagnostic_id,candidate_id)
    REFERENCES app_operations.poc_change_candidates(workspace_id,diagnostic_id,id) ON DELETE CASCADE;
