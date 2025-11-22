import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ImageDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    imageUrl: string | null;
    taskTitle?: string;
    completionDate?: string;
}

export function ImageDialog({ open, onOpenChange, imageUrl, taskTitle, completionDate }: ImageDialogProps) {
    if (!imageUrl) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl">
                        {taskTitle || "Evidencia de Tarea"}
                    </DialogTitle>
                    {completionDate && (
                        <p className="text-sm text-muted-foreground">
                            Completada el {format(new Date(completionDate), "d 'de' MMMM, yyyy", { locale: es })}
                        </p>
                    )}
                </DialogHeader>
                <div className="mt-4">
                    <img
                        src={imageUrl}
                        alt="Evidencia completa"
                        className="w-full h-auto rounded-lg object-contain"
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
