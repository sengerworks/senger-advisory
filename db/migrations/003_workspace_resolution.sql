CREATE FUNCTION app_identity.resolve_workspace(clerk_organization_id_input text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, app_identity
AS $$
  SELECT id
  FROM app_identity.workspaces
  WHERE clerk_organization_id = clerk_organization_id_input
    AND status = 'active'
$$;

REVOKE ALL ON FUNCTION app_identity.resolve_workspace(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_identity.resolve_workspace(text)
  TO capacity_workspace_app;
