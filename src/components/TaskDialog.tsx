import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { z } from "zod";

const taskSchema = z.object({
  title: z.string().min(1, "El título es requerido").max(100, "Máximo 100 caracteres"),
  description: z.string().max(500, "Máximo 500 caracteres").optional(),
  frequency: z.enum(["daily", "weekly", "monthly", "custom"]),
  schedule_config: z.object({
    days: z.array(z.number()).optional(),
  }).optional(),
});

interface Task {
  id?: string;
  title: string;
  description: string | null;
  frequency: string;
  schedule_config?: {
    days?: number[];
  };
}

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (task: Omit<Task, "id"> & { id?: string }) => Promise<void>;
  task?: Task | null;
}

const DAYS = [
  { id: 1, label: "Lunes" },
  { id: 2, label: "Martes" },
  { id: 3, label: "Miércoles" },
  { id: 4, label: "Jueves" },
  { id: 5, label: "Viernes" },
  { id: 6, label: "Sábado" },
  { id: 0, label: "Domingo" },
];

export function TaskDialog({ open, onOpenChange, onSave, task }: TaskDialogProps) {
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    frequency: string;
    schedule_config: { days: number[] };
  }>({
    title: "",
    description: "",
    frequency: "daily",
    schedule_config: { days: [] },
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || "",
        frequency: task.frequency,
        schedule_config: { days: task.schedule_config?.days || [] },
      });
    } else {
      setFormData({
        title: "",
        description: "",
        frequency: "daily",
        schedule_config: { days: [] },
      });
    }
    setErrors({});
  }, [task, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validation = taskSchema.safeParse(formData);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    if (formData.frequency === "custom" && formData.schedule_config.days.length === 0) {
      setErrors({ frequency: "Selecciona al menos un día" });
      return;
    }

    setIsLoading(true);

    // Clean up schedule_config if not custom
    const submissionData = {
      ...formData,
      description: formData.description || null,
      schedule_config: formData.frequency === "custom" ? formData.schedule_config : undefined,
      ...(task?.id && { id: task.id }),
    };

    await onSave(submissionData);
    setIsLoading(false);
    onOpenChange(false);
  };

  const toggleDay = (dayId: number) => {
    setFormData(prev => {
      const currentDays = prev.schedule_config.days;
      const newDays = currentDays.includes(dayId)
        ? currentDays.filter(d => d !== dayId)
        : [...currentDays, dayId];
      return {
        ...prev,
        schedule_config: { ...prev.schedule_config, days: newDays }
      };
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{task ? "Editar Tarea" : "Nueva Tarea"}</DialogTitle>
            <DialogDescription>
              {task ? "Modifica los detalles de tu tarea" : "Crea una nueva tarea u objetivo"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título*</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ej: Hacer ejercicio"
              />
              {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detalles adicionales..."
                rows={3}
              />
              {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="frequency">Frecuencia*</Label>
              <Select
                value={formData.frequency}
                onValueChange={(value) => setFormData({ ...formData, frequency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diario</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensual</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
              {errors.frequency && <p className="text-sm text-destructive">{errors.frequency}</p>}
            </div>

            {formData.frequency === "custom" && (
              <div className="space-y-2">
                <Label>Días de la semana</Label>
                <div className="grid grid-cols-2 gap-2">
                  {DAYS.map((day) => (
                    <div key={day.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`day-${day.id}`}
                        checked={formData.schedule_config.days.includes(day.id)}
                        onCheckedChange={() => toggleDay(day.id)}
                      />
                      <label
                        htmlFor={`day-${day.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {day.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" className="bg-gradient-hero" disabled={isLoading}>
              {isLoading ? "Guardando..." : task ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
