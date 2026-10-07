/*
# Create tasks table (single-tenant, no auth)

1. New Tables
- `tasks`
  - `id` (uuid, primary key)
  - `title` (text, not null) — the task name
  - `description` (text, nullable) — optional details about the task
  - `deadline` (date, nullable) — the due date for the task
  - `completed` (boolean, default false) — whether the task is done
  - `created_at` (timestamptz, default now()) — when the task was created
2. Security
- Enable RLS on `tasks`.
- Allow anon + authenticated CRUD because the data is intentionally shared/public (no sign-in screen).
- Four separate policies for SELECT, INSERT, UPDATE, DELETE.
*/

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  deadline date,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_tasks" ON tasks;
CREATE POLICY "anon_select_tasks" ON tasks FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_tasks" ON tasks;
CREATE POLICY "anon_insert_tasks" ON tasks FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_tasks" ON tasks;
CREATE POLICY "anon_update_tasks" ON tasks FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_tasks" ON tasks;
CREATE POLICY "anon_delete_tasks" ON tasks FOR DELETE
TO anon, authenticated USING (true);
