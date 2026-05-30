-- Migration: Remove auth.users foreign key constraint for development
-- Date: 2026-04-19
-- Purpose: Remove foreign key constraint since app doesn't have login flow and auth.users is empty

-- Drop the foreign key constraint
ALTER TABLE recommendations DROP CONSTRAINT IF EXISTS recommendations_user_id_fkey;

-- Make user_id nullable for development
ALTER TABLE recommendations ALTER COLUMN user_id DROP NOT NULL;
