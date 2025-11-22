-- Add schedule_config column to tasks table
ALTER TABLE public.tasks
ADD COLUMN schedule_config JSONB DEFAULT NULL;
