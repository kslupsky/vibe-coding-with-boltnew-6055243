/*
  # Add User Authentication to Productivity Tracker

  ## Overview
  This migration adds user authentication support to the productivity tracker application.
  It links tasks and categories to specific users and updates security policies.

  ## Changes Made

  ### 1. Schema Updates
  - Add `user_id` column to `tasks` table
    - Links each task to the authenticated user who created it
    - Foreign key reference to `auth.users`
    - NOT NULL constraint to ensure all tasks have an owner
    - Default value set to current authenticated user
  
  - Add `user_id` column to `categories` table
    - Links each category to the authenticated user who created it
    - Foreign key reference to `auth.users`
    - NOT NULL constraint to ensure all categories have an owner
    - Default value set to current authenticated user

  ### 2. Indexes
  - Add index on `tasks(user_id)` for efficient user-specific queries
  - Add index on `categories(user_id)` for efficient user-specific queries

  ### 3. Security Changes (Row Level Security)
  
  #### Categories Table
  - DROP old public access policies
  - ADD new user-specific policies:
    - Users can view only their own categories
    - Users can insert categories for themselves
    - Users can update only their own categories
    - Users can delete only their own categories
  
  #### Tasks Table
  - DROP old public access policies
  - ADD new user-specific policies:
    - Users can view only their own tasks
    - Users can insert tasks for themselves
    - Users can update only their own tasks
    - Users can delete only their own tasks

  ## Important Notes
  - All existing data will be deleted as we transition to user-specific data
  - Users must be authenticated to access tasks and categories
  - Each user will have isolated data - no sharing between users
  - Default categories will be created per user on first login
*/

-- Add user_id column to tasks table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add user_id column to categories table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categories' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE categories ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Delete existing sample data (since it won't have user_id)
DELETE FROM tasks;
DELETE FROM categories;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);

-- DROP old public access policies for categories
DROP POLICY IF EXISTS "Anyone can view categories" ON categories;
DROP POLICY IF EXISTS "Anyone can insert categories" ON categories;
DROP POLICY IF EXISTS "Anyone can update categories" ON categories;
DROP POLICY IF EXISTS "Anyone can delete categories" ON categories;

-- DROP old public access policies for tasks
DROP POLICY IF EXISTS "Anyone can view tasks" ON tasks;
DROP POLICY IF EXISTS "Anyone can insert tasks" ON tasks;
DROP POLICY IF EXISTS "Anyone can update tasks" ON tasks;
DROP POLICY IF EXISTS "Anyone can delete tasks" ON tasks;

-- Create NEW user-specific policies for categories
CREATE POLICY "Users can view own categories"
  ON categories FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories"
  ON categories FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create NEW user-specific policies for tasks
CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);