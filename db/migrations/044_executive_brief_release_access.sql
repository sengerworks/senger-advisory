ALTER TABLE app_shared.diagnostic_executive_briefs
  ADD COLUMN released_by_clerk_user_id text,
  ADD COLUMN released_at timestamptz,
  ADD COLUMN access_mode text CHECK (access_mode IN ('poc-window','permanent')),
  ADD COLUMN access_expires_at timestamptz,
  ADD COLUMN sponsor_notification_status text NOT NULL DEFAULT 'not-ready'
    CHECK (sponsor_notification_status IN ('not-ready','ready-for-delivery','delivered')),
  ADD COLUMN sponsor_notified_at timestamptz,
  ADD CONSTRAINT diagnostic_executive_brief_release_identity_check
    CHECK ((released_at IS NULL) = (released_by_clerk_user_id IS NULL)),
  ADD CONSTRAINT diagnostic_executive_brief_access_window_check
    CHECK (
      (status = 'locked' AND released_at IS NULL AND access_mode IS NULL AND access_expires_at IS NULL)
      OR
      (status = 'released' AND released_at IS NOT NULL AND access_mode = 'permanent' AND access_expires_at IS NULL)
      OR
      (status = 'released' AND released_at IS NOT NULL AND access_mode = 'poc-window' AND access_expires_at IS NOT NULL AND access_expires_at > released_at)
    ),
  ADD CONSTRAINT diagnostic_executive_brief_notification_check
    CHECK ((sponsor_notification_status = 'delivered') = (sponsor_notified_at IS NOT NULL));

CREATE INDEX diagnostic_executive_brief_release_access_idx
  ON app_shared.diagnostic_executive_briefs(workspace_id,status,access_expires_at);
