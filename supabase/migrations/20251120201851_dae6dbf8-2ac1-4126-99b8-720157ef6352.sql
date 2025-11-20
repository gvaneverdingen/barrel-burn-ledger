-- Assign administrator role to your account
INSERT INTO user_roles (user_id, role)
VALUES ('f86939f5-2a24-4278-a7e2-4c1b8eb0ffd0', 'administrator')
ON CONFLICT (user_id, role) DO NOTHING;