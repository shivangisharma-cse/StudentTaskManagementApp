/*
# Add priority column to tasks table

1. Modified Tables
- `tasks`
  - Added `priority` column (text, NOT NULL, default 'medium')
  - Constrained to values: 'high', 'medium', 'low'
2. Security
- No policy changes needed; the existing anon CRUD policies already cover all columns.
3. Notes
- Existing rows (if any) will default to 'medium' priority.
- The column is NOT NULL with a default so all future inserts are safe.
*/

ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'medium'
CHECK (priority IN ('high', 'medium', 'low'));
