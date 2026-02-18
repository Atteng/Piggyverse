"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { ImageUpload } from "@/components/ui/image-upload";
import { useQueryClient } from "@tanstack/react-query";

const gameSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z.string().optional(),
    thumbnailUrl: z.string().optional().or(z.literal("")),
    gameUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
    categories: z.array(z.string()).min(1, "Select at least one category"),
    platforms: z.array(z.string()).min(1, "Select at least one platform"),
});

type GameFormData = z.infer<typeof gameSchema>;

const CATEGORIES = ["Action", "Strategy", "Puzzle", "Sports", "RPG", "Adventure", "Simulation"];
const PLATFORMS = ["Web", "Mobile", "Desktop", "VR"];

export function SubmitGameForm() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();
    const queryClient = useQueryClient();

    const form = useForm<GameFormData>({
        resolver: zodResolver(gameSchema),
        defaultValues: {
            title: "",
            description: "",
            thumbnailUrl: "",
            gameUrl: "",
            categories: [],
            platforms: [],
        },
    });

    const onSubmit = async (data: GameFormData) => {
        setIsSubmitting(true);
        try {
            const res = await fetch("/api/games", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || "Failed to submit game");
            }

            toast({
                title: "App Submitted!",
                description: "Your game has been listed successfully.",
            });

            // Invalidate games query to refresh list
            queryClient.invalidateQueries({ queryKey: ['games'] });

            router.push("/library");
        } catch (error) {
            console.error("Submit error:", error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 bg-black/40 backdrop-blur-3xl p-6 md:p-8 rounded-3xl border border-white/5 shadow-2xl max-w-2xl">
            <div className="space-y-2">
                <Label htmlFor="title" className="font-black font-mono uppercase tracking-widest text-[9px] text-white/70 ml-1">Game Title</Label>
                <Input {...form.register("title")} id="title" className="bg-black/40 border-white/5 text-white h-12 rounded-2xl focus:ring-1 focus:ring-white/10 transition-all placeholder:text-white/30" placeholder="e.g. Piggy Racer" />
                {form.formState.errors.title && <p className="text-red-400 text-[10px] font-mono mt-1 ml-1">{form.formState.errors.title.message}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="description" className="font-black font-mono uppercase tracking-widest text-[9px] text-white/70 ml-1">Description</Label>
                <Textarea {...form.register("description")} id="description" className="bg-black/40 border-white/5 text-white min-h-[120px] rounded-2xl focus:ring-1 focus:ring-white/10 transition-all placeholder:text-white/30" placeholder="What is your game about?" />
            </div>

            <div className="space-y-2">
                <Label className="font-black font-mono uppercase tracking-widest text-[9px] text-white/70 ml-1">Thumbnail Image</Label>
                <ImageUpload
                    value={form.watch("thumbnailUrl") || ""}
                    onChange={(val) => form.setValue("thumbnailUrl", val)}
                />
                {form.formState.errors.thumbnailUrl && <p className="text-red-400 text-[10px] font-mono mt-1 ml-1">{form.formState.errors.thumbnailUrl.message}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="gameUrl" className="font-black font-mono uppercase tracking-widest text-[9px] text-white/70 ml-1">Game URL (Where to play)</Label>
                <Input {...form.register("gameUrl")} id="gameUrl" className="bg-black/40 border-white/5 text-white h-12 rounded-2xl focus:ring-1 focus:ring-white/10 transition-all placeholder:text-white/30" placeholder="https://..." />
                {form.formState.errors.gameUrl && <p className="text-red-400 text-[10px] font-mono mt-1 ml-1">{form.formState.errors.gameUrl.message}</p>}
            </div>

            <div className="space-y-3">
                <Label className="font-black font-mono uppercase tracking-widest text-[9px] text-white/70 ml-1">Categories</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-black/20 p-4 rounded-2xl border border-white/5">
                    {CATEGORIES.map((cat) => (
                        <div key={cat} className="flex items-center space-x-2">
                            <Checkbox
                                id={`cat-${cat}`}
                                className="border-white/20 data-[state=checked]:bg-[var(--color-piggy-deep-pink)] data-[state=checked]:border-[var(--color-piggy-deep-pink)]"
                                onCheckedChange={(checked) => {
                                    const current = form.getValues("categories");
                                    if (checked) form.setValue("categories", [...current, cat]);
                                    else form.setValue("categories", current.filter(c => c !== cat));
                                }}
                            />
                            <Label htmlFor={`cat-${cat}`} className="text-[10px] font-bold text-white cursor-pointer uppercase tracking-tight">{cat}</Label>
                        </div>
                    ))}
                </div>
                {form.formState.errors.categories && <p className="text-red-400 text-[10px] font-mono mt-1 ml-1">{form.formState.errors.categories.message}</p>}
            </div>

            <div className="space-y-3">
                <Label className="font-black font-mono uppercase tracking-widest text-[9px] text-white/70 ml-1">Platforms</Label>
                <div className="flex flex-wrap gap-4 bg-black/20 p-4 rounded-2xl border border-white/5">
                    {PLATFORMS.map((plat) => (
                        <div key={plat} className="flex items-center space-x-2">
                            <Checkbox
                                id={`plat-${plat}`}
                                className="border-white/20 data-[state=checked]:bg-[var(--color-piggy-deep-pink)] data-[state=checked]:border-[var(--color-piggy-deep-pink)]"
                                onCheckedChange={(checked) => {
                                    const current = form.getValues("platforms");
                                    if (checked) form.setValue("platforms", [...current, plat]);
                                    else form.setValue("platforms", current.filter(p => p !== plat));
                                }}
                            />
                            <Label htmlFor={`plat-${plat}`} className="text-[10px] font-bold text-white cursor-pointer uppercase tracking-tight">{plat}</Label>
                        </div>
                    ))}
                </div>
                {form.formState.errors.platforms && <p className="text-red-400 text-[10px] font-mono mt-1 ml-1">{form.formState.errors.platforms.message}</p>}
            </div>

            <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[var(--color-piggy-deep-pink)] hover:bg-[var(--color-piggy-deep-pink)]/90 text-white font-black h-12 rounded-2xl shadow-[0_0_20px_rgba(255,47,122,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-widest text-xs"
            >
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Submit App"}
            </Button>
        </form>
    );
}
