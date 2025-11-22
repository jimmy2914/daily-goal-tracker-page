import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Upload, X, Camera } from "lucide-react";
import { toast } from "sonner";
import { compressImage } from "@/lib/compression";

interface Task {
  id: string;
  title: string;
}

interface CompletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  onComplete: (taskId: string, image: File, date: Date) => Promise<void>;
  selectedDate?: Date;
}

export function CompletionDialog({ open, onOpenChange, task, onComplete, selectedDate }: CompletionDialogProps) {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("La imagen debe ser menor a 5MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error("Solo se permiten imágenes");
        return;
      }
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !image) {
      toast.error("Debes subir una foto de evidencia");
      return;
    }

    setIsLoading(true);
    try {
      const compressedImage = await compressImage(image);

      // Calculate savings for user feedback
      const originalSize = (image.size / 1024 / 1024).toFixed(2);
      const compressedSize = (compressedImage.size / 1024 / 1024).toFixed(2);
      toast.success(`Imagen optimizada: ${originalSize}MB -> ${compressedSize}MB`);

      await onComplete(task.id, compressedImage, selectedDate || new Date());
      setImage(null);
      setPreview(null);
      onOpenChange(false);
    } catch (error) {
      console.error("Error completing task:", error);
      toast.error("Error al procesar la imagen");
    } finally {
      setIsLoading(false);
    }
  };

  const clearImage = () => {
    setImage(null);
    setPreview(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Completar Tarea</DialogTitle>
            <DialogDescription>
              Sube una foto como evidencia de: <strong>{task?.title}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="evidence">Foto de Evidencia*</Label>
              {preview ? (
                <div className="relative">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={clearImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          toast.error("La imagen debe ser menor a 5MB");
                          return;
                        }
                        if (!file.type.startsWith("image/")) {
                          toast.error("Solo se permiten imágenes");
                          return;
                        }
                        setImage(file);
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setPreview(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  >
                    <Label
                      htmlFor="evidence"
                      className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDragging
                        ? "border-primary bg-primary/10"
                        : "bg-muted/30 hover:bg-muted/50"
                        }`}
                    >
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">
                        Click o arrastra para subir imagen
                      </span>
                      <span className="text-xs text-muted-foreground mt-1">
                        Máximo 5MB
                      </span>
                    </Label>
                  </div>

                  <div className="md:hidden">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => document.getElementById("camera-input")?.click()}
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      Tomar Foto
                    </Button>
                    <Input
                      id="camera-input"
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </div>
                </div>
              )}
              <Input
                id="evidence"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              className="bg-gradient-success w-full"
              disabled={isLoading || !image}
            >
              {isLoading ? "Subiendo..." : "Completar Tarea"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
