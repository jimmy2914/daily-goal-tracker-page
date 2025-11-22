-- Update frequency check constraint to include 'custom'
ALTER TABLE public.tasks
DROP CONSTRAINT IF EXISTS tasks_frequency_check;

ALTER TABLE public.tasks
ADD CONSTRAINT tasks_frequency_check 
CHECK (frequency IN ('daily', 'weekly', 'monthly', 'custom'));
