# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2026-01-21-openai-key-settings/spec.md

## Schema Changes

### New Table: user_settings

Store encrypted user settings including API keys.

```sql
CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    openai_api_key_encrypted TEXT,
    openai_api_key_iv TEXT,
    openai_api_key_tag TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Index for fast lookups by user
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Users can only access their own settings
CREATE POLICY "Users can view own settings"
    ON user_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
    ON user_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
    ON user_settings FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings"
    ON user_settings FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

## Column Descriptions

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to auth.users, unique per user |
| openai_api_key_encrypted | TEXT | AES-256-GCM encrypted API key (base64 encoded) |
| openai_api_key_iv | TEXT | Initialization vector for decryption (base64 encoded) |
| openai_api_key_tag | TEXT | Authentication tag for GCM mode (base64 encoded) |
| created_at | TIMESTAMPTZ | Record creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

## Encryption Rationale

AES-256-GCM is used because:
- Industry standard for symmetric encryption
- GCM mode provides both confidentiality and authenticity
- The IV (initialization vector) ensures same plaintext produces different ciphertext
- The auth tag prevents tampering with encrypted data
- All three components (encrypted data, IV, tag) are required for decryption

## Migration

Create migration file: `supabase/migrations/XXXXXX_create_user_settings.sql`

The migration should be run via Supabase CLI or dashboard.
