-- Add email column to resources table
-- Run this migration: psql $DATABASE_URL -f migrations/004_add_email_to_resources.sql

-- Add email column (nullable, as not all resources have email addresses)
ALTER TABLE resources 
ADD COLUMN IF NOT EXISTS email text;

-- Add index for email lookups (optional, but useful if searching by email)
CREATE INDEX IF NOT EXISTS idx_resources_email ON resources(email) WHERE email IS NOT NULL;

