const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function requireWorkspaceId(workspaceId) {
  if (typeof workspaceId !== "string" || !UUID_PATTERN.test(workspaceId)) {
    throw new TypeError("A valid authorized workspace ID is required.");
  }
  return workspaceId;
}

export async function withWorkspaceTransaction(database, workspaceId, operation) {
  const authorizedWorkspaceId = requireWorkspaceId(workspaceId);
  if (!database || typeof database.transaction !== "function" || typeof operation !== "function") {
    throw new TypeError("A database transaction adapter and operation are required.");
  }

  return database.transaction(async (transaction) => {
    await transaction.query(
      "SELECT set_config('app.workspace_id', $1, true)",
      [authorizedWorkspaceId]
    );
    return operation(Object.freeze({
      workspaceId: authorizedWorkspaceId,
      query: (text, parameters = []) => transaction.query(text, parameters)
    }));
  });
}

export function requireMatchingWorkspace(scope, record) {
  const authorizedWorkspaceId = requireWorkspaceId(scope?.workspaceId);
  if (!record || record.workspace_id !== authorizedWorkspaceId) {
    throw new Error("Workspace access denied.");
  }
  return record;
}
