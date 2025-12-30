-- Database constraints for data integrity
-- Run this migration: psql $DATABASE_URL -f migrations/002_add_constraints.sql

-- Add check constraint for message roles (prevent invalid values)
ALTER TABLE messages 
ADD CONSTRAINT chk_messages_role 
CHECK (role IN ('user', 'assistant', 'system'));

-- Add check constraint for update request status
ALTER TABLE update_requests 
ADD CONSTRAINT chk_update_requests_status 
CHECK (status IN ('pending', 'approved', 'rejected'));

-- Add check constraint for update request type
ALTER TABLE update_requests 
ADD CONSTRAINT chk_update_requests_type 
CHECK (request_type IN ('update', 'new', 'remove'));

-- Add email validation constraint (basic format check)
ALTER TABLE update_requests 
ADD CONSTRAINT chk_update_requests_email 
CHECK (contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Add length constraints to prevent DoS
ALTER TABLE conversations 
ADD CONSTRAINT chk_conversations_title_length 
CHECK (char_length(title) <= 200);

ALTER TABLE messages 
ADD CONSTRAINT chk_messages_content_length 
CHECK (char_length(content) <= 10000);

ALTER TABLE update_requests 
ADD CONSTRAINT chk_update_requests_details_length 
CHECK (char_length(details) <= 5000);

-- Add NOT NULL constraint where data integrity requires it
-- (Most are already defined in schema, but ensuring consistency)

-- Index for faster lookups on foreign keys
CREATE INDEX IF NOT EXISTS idx_update_requests_resource_id ON update_requests(resource_id) WHERE resource_id IS NOT NULL;

