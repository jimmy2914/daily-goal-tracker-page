import { useState, useMemo } from "react";
import { format, isSameWeek, isSameMonth, parse } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { TaskCard } from "@/components/TaskCard";
import { TaskDialog } from "@/components/TaskDialog";
import { CompletionDialog } from "@/components/CompletionDialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { canCompleteTask } from "@/lib/taskLogic";

interface Task {
  id: string;
  title: string;
  description: string | null;
  frequency: string;
  active: boolean;
  assigned_date: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isCompletionDialogOpen, setIsCompletionDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskToComplete, setTaskToComplete] = useState<Task | null>(null);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, description, frequency, active, assigned_date")
        .eq("user_id", user?.id)
        .eq("active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Task[];
    },
    enabled: !!user,
  });

  // Fetch recent completions for validation
  const { data: recentCompletions = [] } = useQuery({
    queryKey: ["recent-completions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_completions")
        .select("task_id, completion_date")
        .eq("user_id", user?.id)
        .order("completion_date", { ascending: false })
        .limit(100); // Fetch enough history for validation

      if (error) throw error;
      return data as { task_id: string; completion_date: string }[];
    },
    enabled: !!user,
  });

  // Filter tasks to only show them in their assigned period
  const filteredTasks = useMemo(() => {
    const today = new Date();

    return tasks.filter((task) => {
      const frequency = task.frequency.toLowerCase();

      // Daily tasks always show
      if (frequency === "diaria" || frequency === "daily") {
        return true;
      }

      const assignedDate = parse(task.assigned_date, "yyyy-MM-dd", new Date());

      // Weekly tasks only show in their assigned week
      if (frequency === "semanal" || frequency === "weekly") {
        return isSameWeek(assignedDate, today, { weekStartsOn: 1 });
      }

      // Monthly tasks only show in their assigned month
      if (frequency === "mensual" || frequency === "monthly") {
        return isSameMonth(assignedDate, today);
      }

      return true; // Show other frequencies by default
    });
  }, [tasks]);

  const createTask = useMutation({
    mutationFn: async (task: Omit<Task, "id" | "active">) => {
      const { error } = await supabase.from("tasks").insert({
        ...task,
        user_id: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Tarea creada exitosamente");
    },
    onError: () => {
      toast.error("Error al crear la tarea");
    },
  });

  const updateTask = useMutation({
    mutationFn: async (task: Partial<Task> & { id: string }) => {
      const { error } = await supabase
        .from("tasks")
        .update({
          title: task.title,
          description: task.description,
          frequency: task.frequency,
        })
        .eq("id", task.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Tarea actualizada");
    },
    onError: () => {
      toast.error("Error al actualizar la tarea");
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Tarea eliminada");
    },
    onError: () => {
      toast.error("Error al eliminar la tarea");
    },
  });

  const completeTask = useMutation({
    mutationFn: async ({
      taskId,
      image,
      date,
    }: {
      taskId: string;
      image: File;
      date: Date;
    }) => {
      const fileName = `${user?.id}/${Date.now()}-${image.name}`;
      const { error: uploadError } = await supabase.storage
        .from("task-evidence")
        .upload(fileName, image);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("task-evidence")
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase.from("task_completions").insert({
        task_id: taskId,
        user_id: user?.id,
        completion_date: format(date, "yyyy-MM-dd"),
        image_url: urlData.publicUrl,
      });

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["completions"] });
      toast.success("¡Tarea completada! 🎉");
    },
    onError: (error: any) => {
      if (error.message?.includes("duplicate")) {
        toast.error("Ya completaste esta tarea hoy");
      } else {
        toast.error("Error al completar la tarea");
      }
    },
  });

  const handleSaveTask = async (task: Omit<Task, "id" | "active"> & { id?: string }) => {
    if (task.id) {
      await updateTask.mutateAsync(task as Task);
    } else {
      await createTask.mutateAsync(task);
    }
  };

  const handleCompleteTask = async (taskId: string, image: File, date: Date) => {
    await completeTask.mutateAsync({ taskId, image, date });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mis Tareas</h1>
            <p className="text-muted-foreground">Gestiona tus objetivos diarios</p>
          </div>
          <Button
            className="bg-gradient-hero"
            onClick={() => {
              setSelectedTask(null);
              setIsTaskDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Tarea
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No tienes tareas todavía</p>
            <Button
              className="bg-gradient-hero"
              onClick={() => {
                setSelectedTask(null);
                setIsTaskDialogOpen(true);
              }}
            >
              Crear tu primera tarea
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTasks.map((task) => {
              const validation = canCompleteTask(task, new Date(), recentCompletions);
              return (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={(task) => {
                    setSelectedTask(task);
                    setIsTaskDialogOpen(true);
                  }}
                  onDelete={(id) => deleteTask.mutate(id)}
                  onComplete={(task) => {
                    if (validation.allowed) {
                      setTaskToComplete(task);
                      setIsCompletionDialogOpen(true);
                    } else {
                      toast.error(validation.reason);
                    }
                  }}
                  isCompleted={!validation.allowed} // Visual feedback
                />
              );
            })}
          </div>
        )}

        <TaskDialog
          open={isTaskDialogOpen}
          onOpenChange={setIsTaskDialogOpen}
          task={selectedTask}
          onSave={handleSaveTask}
        />

        <CompletionDialog
          open={isCompletionDialogOpen}
          onOpenChange={setIsCompletionDialogOpen}
          task={taskToComplete}
          onComplete={handleCompleteTask}
        />
      </div>
    </Layout>
  );
}
