CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Super Admin Seed
INSERT INTO
    users (
        name,
        email,
        password_hash,
        role,
        status,
        is_email_verified
    )
VALUES
    (
        'Super Admin',
        'superadmin@example.com',
        crypt ('YourStrongPassword123!', gen_salt ('bf', 10)),
        'SUPER_ADMIN',
        'active',
        TRUE
    )