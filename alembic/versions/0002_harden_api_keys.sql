-- Upgrade api_keys to store hashed keys and add numeric id primary key

-- Add columns for id (bigserial), key_hash and salt
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS id bigserial;
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS key_hash text;
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS salt text;

-- Drop old primary key on key_text (if exists) and set id as primary key
ALTER TABLE api_keys DROP CONSTRAINT IF EXISTS api_keys_pkey;
ALTER TABLE api_keys ADD PRIMARY KEY (id);

-- Make key_text nullable (legacy storage)
ALTER TABLE api_keys ALTER COLUMN key_text DROP NOT NULL;

-- Add unique index for legacy key_text when present
CREATE UNIQUE INDEX IF NOT EXISTS ux_api_keys_key_text ON api_keys(key_text) WHERE key_text IS NOT NULL;

-- (No data migration for existing keys; existing key_text remains usable until rotated.)

