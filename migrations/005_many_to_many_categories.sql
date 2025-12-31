-- Migration 005: Many-to-Many Resource-Category Relationship
-- 
-- This migration implements a many-to-many relationship between resources and categories,
-- allowing resources to belong to multiple categories (e.g., a youth shelter can be
-- in both "shelters" and "youth" categories).
--
-- Industry Best Practices:
-- - Composite primary key prevents duplicate entries
-- - Foreign keys with CASCADE delete maintain referential integrity
-- - Indexes on both foreign keys for optimal query performance
-- - Migration is idempotent (safe to run multiple times)

-- Create junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS resource_categories (
  resource_id INTEGER NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (resource_id, category_id)
);

-- Create indexes for optimal query performance
-- Index on resource_id for queries like "get all categories for a resource"
CREATE INDEX IF NOT EXISTS idx_resource_categories_resource_id ON resource_categories(resource_id);

-- Index on category_id for queries like "get all resources in a category"
CREATE INDEX IF NOT EXISTS idx_resource_categories_category_id ON resource_categories(category_id);

-- Migrate existing data: Copy categoryId relationships to junction table
-- This preserves all existing category assignments
INSERT INTO resource_categories (resource_id, category_id)
SELECT id, category_id
FROM resources
WHERE category_id IS NOT NULL
ON CONFLICT (resource_id, category_id) DO NOTHING;

-- Note: We keep categoryId column for backward compatibility during transition
-- It can be removed in a future migration after all code is updated

