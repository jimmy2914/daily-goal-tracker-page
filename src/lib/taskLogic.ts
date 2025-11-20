import { isFuture, isSameDay, isSameWeek, isSameMonth, parse } from "date-fns";

export interface Task {
    id: string;
    title: string;
    description: string | null;
    frequency: string;
    assigned_date: string; // Date when task was assigned (YYYY-MM-DD)
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

    const frequency = task.frequency.toLowerCase();

    // 2. Daily Task Validation
    if (frequency === "diaria") {
        // Check if already completed today
        const completedToday = completions.some(c =>
            c.task_id === task.id && isSameDay(parse(c.completion_date, "yyyy-MM-dd", new Date()), target)
        );
        if (completedToday) {
            return { allowed: false, reason: "Ya completaste esta tarea hoy" };
        }
    }

    // 3. Weekly Task Validation
    if (frequency === "semanal") {
        // Check if already completed this week
        const completedThisWeek = completions.some(c =>
            c.task_id === task.id && isSameWeek(parse(c.completion_date, "yyyy-MM-dd", new Date()), target, { weekStartsOn: 1 })
        );
        if (completedThisWeek) {
            return { allowed: false, reason: "Ya completaste esta tarea esta semana" };
        }
    }

    // 4. Monthly Task Validation
    if (frequency === "mensual") {
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
