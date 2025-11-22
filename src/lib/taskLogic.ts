import { isFuture, isSameDay, isSameWeek, isSameMonth, parse } from "date-fns";

export interface Task {
    id: string;
    title: string;
    description: string | null;
    frequency: string;
    assigned_date: string; // Date when task was assigned (YYYY-MM-DD)
    schedule_config?: {
        days?: number[]; // 0 = Sunday, 1 = Monday, etc.
    };
}

interface Completion {
    task_id: string;
    completion_date: string;
}

export const canCompleteTask = (
    task: Task,
    targetDate: Date,
    completions: Completion[]
): { allowed: boolean; reason?: string } => {
    const today = new Date();
    const target = new Date(targetDate);

    // 1. Future/Past Validation (Strict Today Only)
    if (!isSameDay(target, today)) {
        return { allowed: false, reason: "Solo puedes completar tareas el día de hoy" };
    }

    const frequency = task.frequency?.toLowerCase() || "";

    // 2. Custom Schedule Validation
    if (frequency === "custom") {
        let config = task.schedule_config;
        if (typeof config === 'string') {
            try {
                config = JSON.parse(config);
            } catch (e) {
                return { allowed: false, reason: "Error de configuración" };
            }
        }

        if (config?.days) {
            const dayOfWeek = target.getDay(); // 0-6 (Sun-Sat)
            const scheduledDays = config.days.map((d: any) => Number(d));

            if (!scheduledDays.includes(dayOfWeek)) {
                return { allowed: false, reason: "Esta tarea no está programada para hoy" };
            }

            // Check if already completed today
            const completedToday = completions.some(c =>
                c.task_id === task.id && isSameDay(parse(c.completion_date, "yyyy-MM-dd", new Date()), target)
            );
            if (completedToday) {
                return { allowed: false, reason: "Ya completaste esta tarea hoy" };
            }
        }
    }

    // 3. Daily Task Validation
    if (frequency === "diaria" || frequency === "daily") {
        // Check if already completed today
        const completedToday = completions.some(c =>
            c.task_id === task.id && isSameDay(parse(c.completion_date, "yyyy-MM-dd", new Date()), target)
        );
        if (completedToday) {
            return { allowed: false, reason: "Ya completaste esta tarea hoy" };
        }
    }

    // 4. Weekly Task Validation
    if (frequency === "semanal" || frequency === "weekly") {
        // Check if already completed this week
        const completedThisWeek = completions.some(c =>
            c.task_id === task.id && isSameWeek(parse(c.completion_date, "yyyy-MM-dd", new Date()), target, { weekStartsOn: 1 })
        );
        if (completedThisWeek) {
            return { allowed: false, reason: "Ya completaste esta tarea esta semana" };
        }
    }

    // 5. Monthly Task Validation
    if (frequency === "mensual" || frequency === "monthly") {
        // Check if already completed this month
        const completedThisMonth = completions.some(c =>
            c.task_id === task.id && isSameMonth(parse(c.completion_date, "yyyy-MM-dd", new Date()), target)
        );
        if (completedThisMonth) {
            return { allowed: false, reason: "Ya completaste esta tarea este mes" };
        }
    }

    return { allowed: true };
};
