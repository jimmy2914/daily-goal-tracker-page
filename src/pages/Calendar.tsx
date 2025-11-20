import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { CompletionDialog } from "@/components/CompletionDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parse, isSameWeek } from "date-fns";
import { es } from "date-fns/locale";
import { canCompleteTask } from "@/lib/taskLogic";

interface Task {
  id: string;
  title: string;
  frequency: string;
  description: string | null;
}

interface Completion {
  task_id: string;
  completion_date: string;
  image_url: string;
}

export default function Calendar() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isCompletionDialogOpen, setIsCompletionDialogOpen] = useState(false);
  const [taskToComplete, setTaskToComplete] = useState<Task | null>(null);

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, frequency, description")
        .eq("user_id", user?.id)
        .eq("active", true);

      if (error) throw error;
      return data as Task[];
    },
    enabled: !!user,
  });

  const { data: completions = [] } = useQuery({
    queryKey: ["completions", user?.id, currentMonth],
    queryFn: async () => {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);

      const { data, error } = await supabase
        .from("task_completions")
        .select("task_id, completion_date, image_url")
        .eq("user_id", user?.id)
        .gte("completion_date", start.toISOString().split("T")[0])
        .lte("completion_date", end.toISOString().split("T")[0]);

      if (error) throw error;
      return data as Completion[];
    },
    enabled: !!user,
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
        toast.error("Ya completaste esta tarea en esta fecha");
      } else {
        toast.error("Error al completar la tarea");
      }
    },
  });

  const handleCompleteTask = async (taskId: string, image: File, date: Date) => {
    await completeTask.mutateAsync({ taskId, image, date });
  };

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const getCompletionsForDate = (date: Date) => {
    return completions.filter((c) =>
      isSameDay(parse(c.completion_date, "yyyy-MM-dd", new Date()), date)
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Calendario</h1>
            <p className="text-muted-foreground">Visualiza tu progreso</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl capitalize">
                {format(currentMonth, "MMMM yyyy", { locale: es })}
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentMonth(new Date())}
                >
                  Hoy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
              {days.map((day) => {
                const dayCompletions = getCompletionsForDate(day);
                const isToday = isSameDay(day, new Date());
                const isPast = day < new Date() && !isToday;

                return (
                  <button
                    key={day.toString()}
                    onClick={() => {
                      setSelectedDate(day);
                    }}
                    className={`
                      aspect-square p-2 rounded-lg text-sm transition-colors
                      ${!isSameMonth(day, currentMonth) ? "text-muted-foreground/40" : ""}
                      ${isToday ? "bg-primary text-primary-foreground font-bold" : "hover:bg-muted"}
                      ${dayCompletions.length > 0 ? "bg-success/20 hover:bg-success/30" : ""}
                    `}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span>{format(day, "d")}</span>
                      {dayCompletions.length > 0 && (
                        <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                          {dayCompletions.length}
                        </Badge>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {selectedDate && (
          <Card>
            <CardHeader>
              <CardTitle>
                {format(selectedDate, "d 'de' MMMM", { locale: es })}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">Tareas para completar</h3>
                {tasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No tienes tareas creadas</p>
                ) : (
                  <div className="grid gap-2">
                    {tasks.filter(task => {
                      const frequency = task.frequency.toLowerCase();
                      if (frequency === "semanal") {
                        return isSameWeek(selectedDate, new Date(), { weekStartsOn: 1 });
                      }
                      if (frequency === "mensual") {
                        return isSameMonth(selectedDate, new Date());
                      }
                      return true;
                    }).map((task) => {
                      const dateStr = selectedDate.toISOString().split("T")[0];
                      const isCompleted = completions.some(
                        (c) => c.task_id === task.id && c.completion_date === dateStr
                      );

                      const validation = canCompleteTask(task, selectedDate, completions);

                      return (
                        <div
                          key={task.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card"
                        >
                          <div className="flex items-center gap-2">
                            {isCompleted && <CheckCircle2 className="h-4 w-4 text-success" />}
                            <span className={isCompleted ? "line-through text-muted-foreground" : ""}>
                              {task.title}
                            </span>
                          </div>
                          {!isCompleted && (
                            <Button
                              size="sm"
                              className="bg-gradient-success"
                              disabled={!validation.allowed}
                              onClick={() => {
                                if (validation.allowed) {
                                  setTaskToComplete(task);
                                  setIsCompletionDialogOpen(true);
                                }
                              }}
                              title={validation.reason}
                            >
                              Completar
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {getCompletionsForDate(selectedDate).length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium">Evidencias del día</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {getCompletionsForDate(selectedDate).map((completion, idx) => (
                      <img
                        key={idx}
                        src={completion.image_url}
                        alt="Evidencia"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <CompletionDialog
          open={isCompletionDialogOpen}
          onOpenChange={setIsCompletionDialogOpen}
          task={taskToComplete}
          onComplete={handleCompleteTask}
          selectedDate={selectedDate || undefined}
        />
      </div>
    </Layout>
  );
}
