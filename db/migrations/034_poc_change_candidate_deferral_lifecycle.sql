ALTER TABLE app_operations.poc_change_candidate_decisions
  DROP CONSTRAINT poc_change_candidate_decisions_workspace_id_candidate_id_key;
CREATE UNIQUE INDEX poc_change_candidate_terminal_decision_idx
  ON app_operations.poc_change_candidate_decisions(workspace_id,candidate_id)
  WHERE decision IN ('approved','rejected');
CREATE INDEX poc_change_candidate_decision_history_idx
  ON app_operations.poc_change_candidate_decisions(workspace_id,candidate_id,created_at DESC);
