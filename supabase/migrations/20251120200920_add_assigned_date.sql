-- Add assigned_date column to tasks table
ALTER TABLE public.tasks
ADD COLUMN assigned_date DATE NOT NULL DEFAULT CURRENT_DATE;

-- Backfill existing tasks with their created_at date
UPDATE public.tasks
SET assigned_date = DATE(created_at)
WHERE assigned_date IS NULL;
