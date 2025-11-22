import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Shield, Globe, Image } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { z } from "zod";
import { EvidenceListDialog } from "@/components/EvidenceListDialog";

const profileSchema = z.object({
  username: z
    .string()
    .min(3, "Mínimo 3 caracteres")
    .max(20, "Máximo 20 caracteres")
    .regex(/^[a-zA-Z0-9_]+$/, "Solo letras, números y guiones bajos"),
});

interface Profile {
  id: string;
  username: string;
  is_public: boolean;
}

export default function Profile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isEvidenceDialogOpen, setIsEvidenceDialogOpen] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

      if (error) throw error;
      setUsername(data.username || "");
      return data as Profile;
    },
    enabled: !!user,
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Perfil actualizado");
      setIsEditing(false);
    },
    onError: (error: any) => {
      if (error.message?.includes("unique")) {
        toast.error("Este nombre de usuario ya está en uso");
      } else {
        toast.error("Error al actualizar perfil");
      }
    },
  });

  const handleUpdateUsername = () => {
    setErrors({});
    const validation = profileSchema.safeParse({ username });

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    updateProfile.mutate({ username });
  };

  const handleTogglePublic = () => {
    if (profile) {
      updateProfile.mutate({ is_public: !profile.is_public });
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Perfil</h1>
          <p className="text-muted-foreground">Gestiona tu cuenta y privacidad</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-gradient-hero text-primary-foreground text-2xl">
                  {profile?.username?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">{profile?.username}</CardTitle>
                <CardDescription>{user?.email}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-medium">Información Personal</h3>
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Nombre de usuario</Label>
                <div className="flex gap-2">
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={!isEditing}
                  />
                  {isEditing ? (
                    <>
                      <Button onClick={handleUpdateUsername} disabled={updateProfile.isPending}>
                        Guardar
                      </Button>
                      <Button variant="outline" onClick={() => {
                        setIsEditing(false);
                        setUsername(profile?.username || "");
                        setErrors({});
                      }}>
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => setIsEditing(true)}>Editar</Button>
                  )}
                </div>
                {errors.username && <p className="text-sm text-destructive">{errors.username}</p>}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-medium">Privacidad</h3>
              </div>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <CardTitle className="text-base">Perfil Público</CardTitle>
                        <CardDescription className="text-sm">
                          Permite que otros usuarios vean tu progreso y tareas
                        </CardDescription>
                      </div>
                    </div>
                    <Switch
                      checked={profile?.is_public || false}
                      onCheckedChange={handleTogglePublic}
                    />
                  </div>
                </CardHeader>
                {profile?.is_public && (
                  <CardContent>
                    <div className="rounded-lg bg-accent/50 p-4">
                      <p className="text-sm text-accent-foreground">
                        ✓ Tu perfil es visible en la sección Social
                      </p>
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Image className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-medium">Evidencias</h3>
              </div>
              <Card
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setIsEvidenceDialogOpen(true)}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base">Galería de Evidencias</CardTitle>
                  <Button variant="ghost" size="sm">Ver todas</Button>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Visualiza todas tus fotos y evidencias completadas
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        <EvidenceListDialog
          open={isEvidenceDialogOpen}
          onOpenChange={setIsEvidenceDialogOpen}
          userId={user?.id || ""}
        />
      </div>
    </Layout>
  );
}
