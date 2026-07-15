CREATE EXTENSION IF NOT EXISTS citext;

-- user table
CREATE TABLE
    IF NOT EXISTS users (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email CITEXT NOT NULL UNIQUE,
        avatar TEXT NOT NULL DEFAULT 'https://www.gravatar.com/avatar/?d=mp&s=200',
        password_hash TEXT,
        phone VARCHAR(20),
        is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
        is_phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
        status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (
            status IN ('active', 'inactive', 'banned', 'deleted')
        ),
        role VARCHAR(20) NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN', 'SUPER_ADMIN')),
        last_login_at TIMESTAMPTZ,
        deleted_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW (),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW ()
    );

-- otps schema
CREATE TABLE
    IF NOT EXISTS otps (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
        otp_hash VARCHAR(255) NOT NULL,
        purpose VARCHAR(20) NOT NULL CHECK (
            purpose IN (
                'email_verify',
                'phone_verify',
                'forgot_password',
                'delete_account',
                'recovery_account'
            )
        ),
        attempts INT DEFAULT 0,
        max_attempts INT DEFAULT 5,
        expires_at TIMESTAMP NOT NULL,
        is_used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

CREATE INDEX idx_otps_user_purpose_used ON otps (user_id, purpose, is_used);

-- refresh_tokens table
CREATE TABLE
    IF NOT EXISTS refresh_tokens (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
        token_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        is_revoked BOOLEAN DEFAULT FALSE,
        device_info VARCHAR(255),
        ip_address INET,
        jti VARCHAR(36) UNIQUE NOT NULL,
        city VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

CREATE INDEX idx_refresh_tokens_user_revoked ON refresh_tokens (user_id, is_revoked);

-- verification_tokens
CREATE TABLE
    IF NOT EXISTS verification_tokens (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
        token_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        is_used BOOLEAN DEFAULT FALSE,
        purpose VARCHAR(20) NOT NULL CHECK (
            purpose IN (
                'email_verify',
                'phone_verify',
                'forgot_password',
                'delete_account',
                'recovery_account'
            )
        ),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

CREATE INDEX idx_verification_tokens_token_purpose_used ON verification_tokens (token_hash, purpose, is_used);