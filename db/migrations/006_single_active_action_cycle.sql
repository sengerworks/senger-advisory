CREATE UNIQUE INDEX action_cycles_one_open_per_round_idx
  ON app_shared.action_cycles(workspace_id, round_id)
  WHERE status IN ('planned', 'active');
