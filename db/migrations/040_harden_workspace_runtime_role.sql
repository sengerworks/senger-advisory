-- Neon-created roles can inherit elevated defaults. The application runtime must
-- always remain subject to the tenant row-level-security policies.
ALTER ROLE capacity_workspace_app NOBYPASSRLS;
