"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Image as ImageIcon, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
    value?: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    className?: string;
}

export function ImageUpload({ value, onChange, disabled, className }: ImageUploadProps) {
    const [preview, setPreview] = useState<string | null>(value || null);

    useEffect(() => {
        setPreview(value || null);
    }, [value]);

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            setPreview(base64String);
            onChange(base64String);
        };
        reader.readAsDataURL(file);
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        setPreview(null);
        onChange("");
    };

    return (
        <div className={cn("relative group cursor-pointer transition-all", className)}>
            <div className={cn(
                "border-2 border-dashed rounded-xl p-4 text-center transition-all flex flex-row items-center justify-center gap-4 h-32 relative overflow-hidden",
                preview ? "border-[var(--color-piggy-deep-pink)]/50 bg-black/40" : "border-white/10 bg-black/20 hover:border-white/30 hover:bg-black/30"
            )}>
                {preview ? (
                    <div className="relative w-full h-full">
                        <img
                            src={preview}
                            alt="Preview"
                            className="w-full h-full object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg pointer-events-none">
                            <p className="text-white font-bold text-sm">Change Image</p>
                        </div>
                        <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 z-10 w-6 h-6 hover:bg-red-600"
                            onClick={handleRemove}
                            disabled={disabled}
                        >
                            <X className="w-3 h-3" />
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Upload className="w-5 h-5 text-gray-400 group-hover:text-white" />
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-bold text-white">Upload Thumbnail</p>
                            <p className="text-xs text-gray-400">JPG, PNG, GIF</p>
                        </div>
                    </>
                )}

                <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-0"
                    onChange={handleUpload}
                    disabled={disabled || (!!preview && false)} // Allow clicking to change even if preview exists (handled by visual overlay)
                />
            </div>
        </div>
    );
}
