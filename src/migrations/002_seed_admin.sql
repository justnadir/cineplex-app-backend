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
        '$argon2id$v=19$m=19456,p=1,t=2$opN2ptddow/+wjiubEcjow$GmaGYG6MDZw6m98NsKU/S5mw4fNDWtvR6sOaTKoIFUs',
        'SUPER_ADMIN',
        'active',
        TRUE
    );