import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

interface PublicProfile {
  id: string;
  username: string;
  is_public: boolean;
}

interface Task {
  id: string;
  title: string;
  frequency: string;
}

interface Completion {
  completion_date: string;
  image_url: string;
}

export default function Social() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: publicProfiles = [] } = useQuery({
    queryKey: ["public-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, is_public")
        .eq("is_public", true)
        .neq("id", user?.id);

      if (error) throw error;
      return data as PublicProfile[];
    },
    enabled: !!user,
  });

  const { data: publicTasks = [] } = useQuery({
    queryKey: ["public-tasks"],
    queryFn: async () => {
      const profileIds = publicProfiles.map((p) => p.id);
      if (profileIds.length === 0) return [];

      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, frequency, user_id")
        .in("user_id", profileIds)
        .eq("active", true);

      if (error) throw error;
      return data;
    },
    enabled: publicProfiles.length > 0,
  });

  const { data: publicCompletions = [] } = useQuery({
    queryKey: ["public-completions"],
    queryFn: async () => {
      const profileIds = publicProfiles.map((p) => p.id);
      if (profileIds.length === 0) return [];

      const { data, error } = await supabase
        .from("task_completions")
        .select("completion_date, image_url, user_id, task_id")
        .in("user_id", profileIds)
        .order("completion_date", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
    enabled: publicProfiles.length > 0,
  });

  const getUsernameById = (userId: string) => {
    return publicProfiles.find((p) => p.id === userId)?.username || "Usuario";
  };

  const getTaskById = (taskId: string) => {
    return publicTasks.find((t) => t.id === taskId);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Social</h1>
          <p className="text-muted-foreground">Ve el progreso de otros usuarios</p>
        </div>

        {publicProfiles.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Lock className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay usuarios públicos</h3>
              <p className="text-sm text-muted-foreground text-center max-w-sm">
                Activa tu perfil público en la sección de Perfil para aparecer aquí y ver a otros usuarios
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div>
              <h2 className="text-xl font-semibold mb-4">Usuarios Activos</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {publicProfiles.map((profile) => {
                  const userTasks = publicTasks.filter((t) => t.user_id === profile.id);
                  const userCompletions = publicCompletions.filter((c) => c.user_id === profile.id);

                  return (
                    <Card
                      key={profile.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => navigate(`/social/${profile.id}`)}
                    >
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback className="bg-gradient-hero text-primary-foreground">
                              {profile.username?.[0]?.toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-lg">{profile.username}</CardTitle>
                            <CardDescription>{userTasks.length} tareas activas</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Completaciones</span>
                            <Badge variant="secondary">{userCompletions.length}</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {publicCompletions.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Actividad Reciente</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {publicCompletions.map((completion, idx) => {
                    const task = getTaskById(completion.task_id);
                    return (
                      <Card key={idx}>
                        <CardContent className="p-0">
                          <img
                            src={completion.image_url}
                            alt="Evidencia"
                            className="w-full h-48 object-cover rounded-t-lg"
                          />
                          <div className="p-4 space-y-2">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs bg-gradient-hero text-primary-foreground">
                                  {getUsernameById(completion.user_id)[0]?.toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">
                                {getUsernameById(completion.user_id)}
                              </span>
                            </div>
                            <p className="text-sm">{task?.title || "Tarea"}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(completion.completion_date).toLocaleDateString("es-ES", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
