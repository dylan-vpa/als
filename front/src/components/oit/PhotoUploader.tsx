import React from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import Button from "../ui/Button";

interface PhotoUploaderProps {
    photos: string[];
    onAdd: (photos: string[]) => void;
    onRemove: (index: number) => void;
    maxPhotos?: number;
    maxSizeMB?: number;
    label?: string;
    required?: boolean;
}

export default function PhotoUploader({
    photos = [],
    onAdd,
    onRemove,
    maxPhotos = 6,
    maxSizeMB = 1.5,
    label = "Fotos/Evidencias",
    required = false
}: PhotoUploaderProps) {
    const [error, setError] = React.useState<string | null>(null);
    const [loading, setLoading] = React.useState(false);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        setError(null);
        setLoading(true);

        try {
            const remaining = maxPhotos - photos.length;
            if (files.length > remaining) {
                setError(`Solo puedes agregar ${remaining} foto${remaining === 1 ? '' : 's'} más`);
                setLoading(false);
                return;
            }

            const validFiles: string[] = [];

            for (const file of files) {
                if (!file.type.startsWith('image/')) {
                    setError(`${file.name} no es una imagen válida`);
                    continue;
                }

                if (file.size > maxSizeMB * 1024 * 1024) {
                    setError(`${file.name} supera ${maxSizeMB}MB`);
                    continue;
                }

                const dataUrl = await readFileAsDataUrl(file);
                validFiles.push(dataUrl);
            }

            if (validFiles.length > 0) {
                onAdd(validFiles);
            }
        } catch (err) {
            setError('Error al cargar las imágenes');
        } finally {
            setLoading(false);
            e.target.value = '';
        }
    };

    const readFileAsDataUrl = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <span className="text-xs text-muted-foreground">
                    {photos.length}/{maxPhotos} fotos
                </span>
            </div>

            {photos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {photos.map((photo, index) => (
                        <div key={index} className="relative group">
                            <img
                                src={photo}
                                alt={`Foto ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg border border-border"
                            />
                            <button
                                type="button"
                                onClick={() => onRemove(index)}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                aria-label="Eliminar foto"
                            >
                                <X size={16} />
                            </button>
                            <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                                {index + 1}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {photos.length < maxPhotos && (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer bg-muted/20 hover:bg-muted/40 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {loading ? (
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        ) : (
                            <>
                                <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">
                                    <span className="font-semibold">Click para subir</span> o arrastra aquí
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Máx. {maxSizeMB}MB por imagen
                                </p>
                            </>
                        )}
                    </div>
                    <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        multiple
                        onChange={handleFileSelect}
                        disabled={loading}
                    />
                </label>
            )}

            {error && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                    <span>⚠️</span> {error}
                </p>
            )}
        </div>
    );
}
