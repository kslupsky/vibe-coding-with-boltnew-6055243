/*
  # Productivity Tracker Database Schema

  ## Overview
  This migration creates the complete database schema for a productivity tracker application
  with drag-and-drop task management, categories, and due dates.

  ## New Tables

  ### `categories`
  Stores task categories with custom colors and icons
  - `id` (uuid, primary key) - Unique identifier for each category
  - `name` (text, unique) - Category name (e.g., "Work", "Personal")
  - `color` (text) - Hex color code for visual identification
  - `icon` (text) - Icon identifier for category display
  - `created_at` (timestamptz) - Timestamp when category was created

  ### `tasks`
  Stores all task information with status, priority, and organization
  - `id` (uuid, primary key) - Unique identifier for each task
  - `title` (text) - Task title/name
  - `description` (text) - Detailed task description
  - `status` (text) - Current status: 'todo', 'in_progress', or 'done'
  - `priority` (text) - Priority level: 'low', 'medium', or 'high'
  - `category_id` (uuid, foreign key) - Reference to categories table
  - `due_date` (timestamptz) - When the task is due
  - `position` (integer) - Order position within status column for drag-and-drop
  - `created_at` (timestamptz) - Timestamp when task was created
  - `updated_at` (timestamptz) - Timestamp when task was last modified

  ## Security
  - Enable Row Level Security (RLS) on both tables
  - Add policies allowing public read and write access (single-user app)
  - All users can view, create, update, and delete categories and tasks

  ## Initial Data
  - Seed database with 5 default categories: Work, Personal, Health, Learning, Shopping
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  color text NOT NULL,
  icon text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  status text NOT NULL DEFAULT 'todo',
  priority text NOT NULL DEFAULT 'medium',
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  due_date timestamptz,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_position ON tasks(status, position);

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for categories (public access)
CREATE POLICY "Anyone can view categories"
  ON categories FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert categories"
  ON categories FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update categories"
  ON categories FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete categories"
  ON categories FOR DELETE
  USING (true);

-- Create policies for tasks (public access)
CREATE POLICY "Anyone can view tasks"
  ON tasks FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert tasks"
  ON tasks FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update tasks"
  ON tasks FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete tasks"
  ON tasks FOR DELETE
  USING (true);

-- Insert default categories
INSERT INTO categories (name, color, icon) VALUES
  ('Work', '#3B82F6', 'briefcase'),
  ('Personal', '#10B981', 'user'),
  ('Health', '#EF4444', 'heart'),
  ('Learning', '#8B5CF6', 'book-open'),
  ('Shopping', '#F59E0B', 'shopping-cart')
ON CONFLICT (name) DO NOTHING;

-- Insert sample tasks
INSERT INTO tasks (title, description, status, priority, category_id, due_date, position) VALUES
  (
    'Complete project proposal',
    'Finish the Q1 project proposal and send it to the team',
    'in_progress',
    'high',
    (SELECT id FROM categories WHERE name = 'Work' LIMIT 1),
    now() + interval '2 days',
    0
  ),
  (
    'Buy groceries',
    'Get vegetables, fruits, and milk from the store',
    'todo',
    'medium',
    (SELECT id FROM categories WHERE name = 'Shopping' LIMIT 1),
    now() + interval '1 day',
    0
  ),
  (
    'Gym workout',
    'Evening workout session - chest and triceps',
    'todo',
    'medium',
    (SELECT id FROM categories WHERE name = 'Health' LIMIT 1),
    now(),
    1
  ),
  (
    'Read React documentation',
    'Study the new React 19 features and hooks',
    'in_progress',
    'low',
    (SELECT id FROM categories WHERE name = 'Learning' LIMIT 1),
    now() + interval '5 days',
    1
  ),
  (
    'Call dentist',
    'Schedule teeth cleaning appointment',
    'todo',
    'high',
    (SELECT id FROM categories WHERE name = 'Personal' LIMIT 1),
    now() + interval '3 days',
    2
  ),
  (
    'Update portfolio website',
    'Add recent projects and update the about section',
    'done',
    'medium',
    (SELECT id FROM categories WHERE name = 'Work' LIMIT 1),
    now() - interval '2 days',
    0
  )
ON CONFLICT DO NOTHING;