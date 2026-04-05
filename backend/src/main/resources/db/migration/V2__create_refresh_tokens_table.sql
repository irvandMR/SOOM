CREATE TABLE refresh_tokens (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token varchar(255) NOT NULL UNIQUE,
    expires_at timestamp NOT NULL,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    created_by varchar(50) DEFAULT 'SYSTEM',
    updated_at timestamp,
    updated_by varchar(50),
    is_deleted boolean DEFAULT false
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);