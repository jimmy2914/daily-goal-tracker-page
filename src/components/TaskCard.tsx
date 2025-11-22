import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, CheckCircle2 } from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string | null;
  frequency: string;
  active: boolean;
  assigned_date: string;
}

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onComplete: (task: Task) => void;
  isCompleted?: boolean;
}

export function TaskCard({ task, onEdit, onDelete, onComplete, isCompleted }: TaskCardProps) {
  const frequencyColors = {
    daily: "bg-primary",
    weekly: "bg-accent",
    monthly: "bg-secondary",
  };

  const frequencyLabels = {
    daily: "Diario",
    weekly: "Semanal",
    monthly: "Mensual",
    custom: "Personalizado",
  };

  return (
    <Card className="shadow-card transition-all hover:shadow-elevated">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{task.title}</CardTitle>
            {task.description && (
              <CardDescription className="mt-1">{task.description}</CardDescription>
            )}
          </div>
          <Badge className={frequencyColors[task.frequency as keyof typeof frequencyColors]}>
            {frequencyLabels[task.frequency as keyof typeof frequencyLabels]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(task)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(task.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            className={isCompleted ? "bg-muted text-muted-foreground" : "bg-gradient-success"}
            onClick={() => onComplete(task)}
            disabled={isCompleted}
          >
            {isCompleted ? "Completada" : "Completar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
