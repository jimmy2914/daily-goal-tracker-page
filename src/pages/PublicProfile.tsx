import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    TrendingUp,
    Image,
    ArrowLeft
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    startOfWeek,
    endOfWeek,
    differenceInDays
} from "date-fns";
import { es } from "date-fns/locale";

interface Task {
    id: string;
    title: string;
    frequency: string;
}

interface Completion {
    task_id: string;
    completion_date: string;
    image_url: string;
}

interface Profile {
    username: string;
}

import { EvidenceListDialog } from "@/components/EvidenceListDialog";
import { ImageDialog } from "@/components/ImageDialog";

export default function PublicProfile() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [isEvidenceDialogOpen, setIsEvidenceDialogOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<{
        url: string;
        title?: string;
        date?: string;
    } | null>(null);

    // Fetch Profile Info
    const { data: profile } = useQuery({
        queryKey: ["profile", userId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("profiles")
                .select("username")
                .eq("id", userId)
                .single();

            if (error) throw error;
            return data as Profile;
        },
        enabled: !!userId,
    });

    // Fetch Tasks
    const { data: tasks = [] } = useQuery({
        queryKey: ["public-tasks", userId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("tasks")
                .select("id, title, frequency")
                .eq("user_id", userId)
                .eq("active", true);

            if (error) throw error;
            return data as Task[];
        },
        enabled: !!userId,
    });

    // Fetch Month Completions (for Calendar)
    const { data: monthCompletions = [] } = useQuery({
        queryKey: ["public-completions", userId, currentMonth],
        queryFn: async () => {
            const start = startOfMonth(currentMonth);
            const end = endOfMonth(currentMonth);

            const { data, error } = await supabase
                .from("task_completions")
                .select("task_id, completion_date, image_url")
                .eq("user_id", userId)
                .gte("completion_date", start.toISOString().split("T")[0])
                .lte("completion_date", end.toISOString().split("T")[0]);

            if (error) throw error;
            return data as Completion[];
        },
        enabled: !!userId,
    });

    // Fetch All Completions (for Stats)
    const { data: allCompletions = [] } = useQuery({
        queryKey: ["public-all-completions", userId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("task_completions")
                .select("completion_date")
                .eq("user_id", userId)
                .order("completion_date", { ascending: false });

            if (error) throw error;
            return data;
        },
        enabled: !!userId,
    });

    // Calendar Logic
    const days = eachDayOfInterval({
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth),
    });

    const getCompletionsForDate = (date: Date) => {
        return monthCompletions.filter((c) =>
            isSameDay(new Date(c.completion_date), date)
        );
    };

    // Stats Logic
    const today = new Date().toISOString().split("T")[0];
    const todayCompletions = allCompletions.filter((c) => c.completion_date === today).length;
    const todayPercentage = tasks.length > 0 ? (todayCompletions / tasks.length) * 100 : 0;

    const weekStart = startOfWeek(new Date()).toISOString().split("T")[0];
    const weekEnd = endOfWeek(new Date()).toISOString().split("T")[0];
    const weekCompletions = allCompletions.filter(
        (c) => c.completion_date >= weekStart && c.completion_date <= weekEnd
    );
    const uniqueWeekDays = new Set(weekCompletions.map((c) => c.completion_date)).size;
    const weekPercentage = (uniqueWeekDays / 7) * 100;

    const monthStart = startOfMonth(new Date()).toISOString().split("T")[0];
    const monthEnd = endOfMonth(new Date()).toISOString().split("T")[0];
    const monthCompletionsStats = allCompletions.filter(
        (c) => c.completion_date >= monthStart && c.completion_date <= monthEnd
    );
    const daysInMonth = differenceInDays(endOfMonth(new Date()), startOfMonth(new Date())) + 1;
    const uniqueMonthDays = new Set(monthCompletionsStats.map((c) => c.completion_date)).size;
    const monthPercentage = (uniqueMonthDays / daysInMonth) * 100;

    const sortedDates = [...new Set(allCompletions.map((c) => c.completion_date))].sort().reverse();
    let currentStreak = 0;
    let checkDate = new Date();

    for (let i = 0; i < sortedDates.length; i++) {
        const completionDate = new Date(sortedDates[i]);
        const expectedDate = new Date(checkDate);
        expectedDate.setDate(expectedDate.getDate() - i);

        if (completionDate.toISOString().split("T")[0] === expectedDate.toISOString().split("T")[0]) {
            currentStreak++;
        } else {
            break;
        }
    }

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate("/social")}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Perfil de {profile?.username || "Usuario"}
                        </h1>
                        <p className="text-muted-foreground">Visualizando progreso público</p>
                    </div>
                </div>

                <Tabs defaultValue="calendar" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="calendar">Calendario</TabsTrigger>
                        <TabsTrigger value="stats">Estadísticas</TabsTrigger>
                    </TabsList>

                    <TabsContent value="calendar" className="space-y-6">
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

                                        return (
                                            <button
                                                key={day.toString()}
                                                onClick={() => setSelectedDate(day)}
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
                                        <h3 className="font-medium">Tareas del usuario</h3>
                                        {tasks.length === 0 ? (
                                            <p className="text-sm text-muted-foreground">No tiene tareas activas</p>
                                        ) : (
                                            <div className="grid gap-2">
                                                {tasks.map((task) => {
                                                    const dateStr = selectedDate.toISOString().split("T")[0];
                                                    const isCompleted = monthCompletions.some(
                                                        (c) => c.task_id === task.id && c.completion_date === dateStr
                                                    );

                                                    return (
                                                        <div
                                                            key={task.id}
                                                            className="flex items-center justify-between p-3 rounded-lg border bg-card"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                {isCompleted ? (
                                                                    <CheckCircle2 className="h-4 w-4 text-success" />
                                                                ) : (
                                                                    <div className="h-4 w-4 rounded-full border border-muted-foreground" />
                                                                )}
                                                                <span className={isCompleted ? "line-through text-muted-foreground" : ""}>
                                                                    {task.title}
                                                                </span>
                                                            </div>
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
                                                {getCompletionsForDate(selectedDate).map((completion, idx) => {
                                                    const task = tasks.find(t => t.id === completion.task_id);
                                                    return (
                                                        <div
                                                            key={idx}
                                                            className="relative group cursor-pointer overflow-hidden rounded-lg"
                                                            onClick={() => setSelectedImage({
                                                                url: completion.image_url,
                                                                title: task?.title,
                                                                date: completion.completion_date
                                                            })}
                                                        >
                                                            <img
                                                                src={completion.image_url}
                                                                alt="Evidencia"
                                                                className="w-full h-32 object-cover transition-transform group-hover:scale-105"
                                                            />
                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                <span className="text-white text-xs font-medium px-2 text-center">
                                                                    {task?.title || "Ver detalle"}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent value="stats" className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Racha Actual</CardTitle>
                                    <TrendingUp className="h-4 w-4 text-success" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{currentStreak} días</div>
                                </CardContent>
                            </Card>

                            <Card
                                className="cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => setIsEvidenceDialogOpen(true)}
                            >
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Evidencias</CardTitle>
                                    <Image className="h-4 w-4 text-accent" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{allCompletions.length}</div>
                                    <p className="text-xs text-muted-foreground mt-1">Ver galería completa</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Tareas Activas</CardTitle>
                                    <CheckCircle2 className="h-4 w-4 text-primary" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{tasks.length}</div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Días Activos</CardTitle>
                                    <CalendarIcon className="h-4 w-4 text-warning" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {new Set(allCompletions.map((c: any) => c.completion_date)).size}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Hoy</CardTitle>
                                    <CardDescription>Progreso del día actual</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Completadas</span>
                                        <span className="font-medium">
                                            {todayCompletions}/{tasks.length}
                                        </span>
                                    </div>
                                    <Progress value={todayPercentage} className="h-2" />
                                    <p className="text-xs text-muted-foreground">{todayPercentage.toFixed(0)}% completado</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Esta Semana</CardTitle>
                                    <CardDescription>Días activos esta semana</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Días activos</span>
                                        <span className="font-medium">{uniqueWeekDays}/7</span>
                                    </div>
                                    <Progress value={weekPercentage} className="h-2" />
                                    <p className="text-xs text-muted-foreground">{weekPercentage.toFixed(0)}% de la semana</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Este Mes</CardTitle>
                                    <CardDescription>Días activos este mes</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Días activos</span>
                                        <span className="font-medium">
                                            {uniqueMonthDays}/{daysInMonth}
                                        </span>
                                    </div>
                                    <Progress value={monthPercentage} className="h-2" />
                                    <p className="text-xs text-muted-foreground">{monthPercentage.toFixed(0)}% del mes</p>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>

                <EvidenceListDialog
                    open={isEvidenceDialogOpen}
                    onOpenChange={setIsEvidenceDialogOpen}
                    userId={userId || ""}
                    username={profile?.username}
                />

                <ImageDialog
                    open={!!selectedImage}
                    onOpenChange={(open) => !open && setSelectedImage(null)}
                    imageUrl={selectedImage?.url || null}
                    taskTitle={selectedImage?.title}
                    completionDate={selectedImage?.date}
                />
            </div >
        </Layout >
    );
}
