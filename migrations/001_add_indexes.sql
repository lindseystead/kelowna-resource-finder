-- Database indexes for performance optimization
-- Run this migration after initial setup: psql $DATABASE_URL -f migrations/001_add_indexes.sql

-- Index for category lookups by slug (frequently queried)
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- Index for resource lookups by category (most common filter)
CREATE INDEX IF NOT EXISTS idx_resources_category_id ON resources(category_id);

-- Index for resource name search (case-insensitive search)
CREATE INDEX IF NOT EXISTS idx_resources_name_search ON resources USING gin(to_tsvector('english', name));

-- Index for resource description search
CREATE INDEX IF NOT EXISTS idx_resources_description_search ON resources USING gin(to_tsvector('english', description));

-- Index for verified resources (common filter)
CREATE INDEX IF NOT EXISTS idx_resources_verified ON resources(verified) WHERE verified = true;

-- Index for update requests by status (admin queries)
CREATE INDEX IF NOT EXISTS idx_update_requests_status ON update_requests(status);

-- Index for update requests by creation date (admin sorting)
CREATE INDEX IF NOT EXISTS idx_update_requests_created_at ON update_requests(created_at DESC);

-- Index for messages by conversation (chat queries)
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);

-- Index for messages by creation date (chat sorting)
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

