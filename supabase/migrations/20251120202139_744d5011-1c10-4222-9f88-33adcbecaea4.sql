-- Assign administrator role to arnoudtaminiau@hotmail.com
INSERT INTO user_roles (user_id, role)
VALUES ('fc1421f8-9702-4a0b-9a87-3d401cf1adfd', 'administrator')
ON CONFLICT (user_id, role) DO NOTHING;