import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Calendar, CheckCircle2, Image } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, differenceInDays } from "date-fns";

export default function Stats() {
  const { user } = useAuth();

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("id")
        .eq("user_id", user?.id)
        .eq("active", true);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: completions = [] } = useQuery({
    queryKey: ["all-completions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_completions")
        .select("completion_date")
        .eq("user_id", user?.id)
        .order("completion_date", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Today's stats
  const today = new Date().toISOString().split("T")[0];
  const todayCompletions = completions.filter((c) => c.completion_date === today).length;
  const todayPercentage = tasks.length > 0 ? (todayCompletions / tasks.length) * 100 : 0;

  // Week stats
  const weekStart = startOfWeek(new Date()).toISOString().split("T")[0];
  const weekEnd = endOfWeek(new Date()).toISOString().split("T")[0];
  const weekCompletions = completions.filter(
    (c) => c.completion_date >= weekStart && c.completion_date <= weekEnd
  );
  const uniqueWeekDays = new Set(weekCompletions.map((c) => c.completion_date)).size;
  const weekPercentage = (uniqueWeekDays / 7) * 100;

  // Month stats
  const monthStart = startOfMonth(new Date()).toISOString().split("T")[0];
  const monthEnd = endOfMonth(new Date()).toISOString().split("T")[0];
  const monthCompletions = completions.filter(
    (c) => c.completion_date >= monthStart && c.completion_date <= monthEnd
  );
  const daysInMonth = differenceInDays(endOfMonth(new Date()), startOfMonth(new Date())) + 1;
  const uniqueMonthDays = new Set(monthCompletions.map((c) => c.completion_date)).size;
  const monthPercentage = (uniqueMonthDays / daysInMonth) * 100;

  // Streak calculation
  const sortedDates = [...new Set(completions.map((c) => c.completion_date))].sort().reverse();
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Estadísticas</h1>
          <p className="text-muted-foreground">Tu progreso y logros</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Racha Actual</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentStreak} días</div>
              <p className="text-xs text-muted-foreground">¡Sigue así!</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Evidencias</CardTitle>
              <Image className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completions.length}</div>
              <p className="text-xs text-muted-foreground">Fotos subidas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tareas Activas</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tasks.length}</div>
              <p className="text-xs text-muted-foreground">Objetivos activos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Días Activos</CardTitle>
              <Calendar className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(completions.map((c) => c.completion_date)).size}
              </div>
              <p className="text-xs text-muted-foreground">Total de días</p>
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

        {completions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Últimas Evidencias</CardTitle>
              <CardDescription>Tus logros más recientes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Última completación: {new Date(completions[0].completion_date).toLocaleDateString("es-ES", { 
                  year: "numeric",
                  month: "long",
                  day: "numeric"
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
