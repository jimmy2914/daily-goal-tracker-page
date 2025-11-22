import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ImageDialog } from "./ImageDialog";

interface EvidenceListDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    userId: string;
    username?: string;
}

interface Evidence {
    id: string;
    image_url: string;
    completion_date: string;
    task: {
        title: string;
    };
}

export function EvidenceListDialog({ open, onOpenChange, userId, username }: EvidenceListDialogProps) {
    const [selectedImage, setSelectedImage] = useState<{
        url: string;
        title?: string;
        date?: string;
    } | null>(null);

    const { data: evidences = [], isLoading } = useQuery({
        queryKey: ["all-evidences", userId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("task_completions")
                .select(`
          id,
          image_url,
          completion_date,
          task:tasks (
            title
          )
        `)
                .eq("user_id", userId)
                .order("completion_date", { ascending: false });

            if (error) throw error;
            return data as unknown as Evidence[];
        },
        enabled: open && !!userId,
    });

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Galería de Evidencias {username ? `de ${username}` : ""}</DialogTitle>
                    </DialogHeader>

                    {isLoading ? (
                        <div className="flex justify-center p-8">Cargando evidencias...</div>
                    ) : evidences.length === 0 ? (
                        <div className="text-center p-8 text-muted-foreground">No hay evidencias registradas</div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                            {evidences.map((evidence) => (
                                <div
                                    key={evidence.id}
                                    className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg border bg-muted"
                                    onClick={() => setSelectedImage({
                                        url: evidence.image_url,
                                        title: evidence.task.title,
                                        date: evidence.completion_date
                                    })}
                                >
                                    <img
                                        src={evidence.image_url}
                                        alt={evidence.task.title}
                                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100 flex flex-col items-center justify-center p-2 text-center">
                                        <p className="text-white font-medium text-sm line-clamp-2">{evidence.task.title}</p>
                                        <p className="text-white/80 text-xs mt-1">
                                            {format(new Date(evidence.completion_date), "d MMM", { locale: es })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <ImageDialog
                open={!!selectedImage}
                onOpenChange={(open) => !open && setSelectedImage(null)}
                imageUrl={selectedImage?.url || null}
                taskTitle={selectedImage?.title}
                completionDate={selectedImage?.date}
            />
        </>
    );
}
