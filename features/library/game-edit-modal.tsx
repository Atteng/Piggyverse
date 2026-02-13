"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateGame, deleteGame, GameFrontend } from "@/lib/api/games";
import { Loader2, Trash2, AlertTriangle } from "lucide-react";
import { ImageUpload } from "@/components/ui/image-upload";
import { Switch } from "@/components/ui/switch";

const gameSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters").optional(),
    description: z.string().optional(),
    thumbnailUrl: z.string().optional().or(z.literal("")),
    gameUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
    categories: z.array(z.string()).min(1, "Select at least one category").optional(),
    platforms: z.array(z.string()).min(1, "Select at least one platform").optional(),
    isListed: z.boolean().optional(),
});

type GameEditData = z.infer<typeof gameSchema>;

const CATEGORIES = ["Action", "Strategy", "Puzzle", "Sports", "RPG", "Adventure", "Simulation"];
const PLATFORMS = ["Web", "Mobile", "Desktop", "VR"];

interface GameEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    game: GameFrontend;
}

export function GameEditModal({ isOpen, onClose, game }: GameEditModalProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isDeleting, setIsDeleting] = useState(false);

    const form = useForm<GameEditData>({
        resolver: zodResolver(gameSchema),
        defaultValues: {
            title: game.title,
            description: game.description || "",
            thumbnailUrl: game.thumbnailUrl || "",
            gameUrl: game.gameUrl || "",
            categories: game.categories || [],
            platforms: game.platforms || [],
            isListed: game.isListed ?? true,
        },
    });

    const updateMutation = useMutation({
        mutationFn: (data: GameEditData) => updateGame(game.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['games'] });
            toast({ title: "Game Updated", description: "Your changes have been saved." });
            onClose();
        },
        onError: (error: Error) => {
            toast({ title: "Update Failed", description: error.message, variant: "destructive" });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: () => deleteGame(game.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['games'] });
            toast({ title: "Game Deleted", description: "The game has been removed from the library." });
            onClose();
        },
        onError: (error: Error) => {
            toast({ title: "Delete Failed", description: error.message, variant: "destructive" });
            setIsDeleting(false);
        },
    });

    const onSubmit = (data: GameEditData) => {
        updateMutation.mutate(data);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-[#1a1a1a] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black font-mono uppercase tracking-tighter">Edit Game</DialogTitle>
                    <DialogDescription className="text-gray-400 font-mono">
                        Update the details for your game listing.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-bold uppercase tracking-wider text-gray-400">Game Title</FormLabel>
                                    <FormControl>
                                        <Input {...field} className="bg-black/20 border-white/10 text-white focus:border-[var(--color-piggy-deep-pink)] transition-colors" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-bold uppercase tracking-wider text-gray-400">Description</FormLabel>
                                    <FormControl>
                                        <Textarea {...field} className="bg-black/20 border-white/10 text-white min-h-[100px] focus:border-[var(--color-piggy-deep-pink)] transition-colors" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="thumbnailUrl"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-bold uppercase tracking-wider text-gray-400">Thumbnail Image</FormLabel>
                                    <FormControl>
                                        <ImageUpload
                                            value={field.value || ""}
                                            onChange={field.onChange}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="gameUrl"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-bold uppercase tracking-wider text-gray-400">Game URL (Where to play)</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="https://..." className="bg-black/20 border-white/10 text-white focus:border-[var(--color-piggy-deep-pink)] transition-colors" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="categories"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-bold uppercase tracking-wider text-gray-400">Categories</FormLabel>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-black/20 p-4 rounded-xl border border-white/5">
                                        {CATEGORIES.map((cat) => (
                                            <div key={cat} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`edit-cat-${cat}`}
                                                    checked={field.value?.includes(cat)}
                                                    onCheckedChange={(checked) => {
                                                        const current = field.value || [];
                                                        if (checked) field.onChange([...current, cat]);
                                                        else field.onChange(current.filter(c => c !== cat));
                                                    }}
                                                    className="border-white/20 data-[state=checked]:bg-[var(--color-piggy-deep-pink)]"
                                                />
                                                <label htmlFor={`edit-cat-${cat}`} className="text-sm text-gray-300 cursor-pointer">{cat}</label>
                                            </div>
                                        ))}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="platforms"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-bold uppercase tracking-wider text-gray-400">Platforms</FormLabel>
                                    <div className="flex flex-wrap gap-6 bg-black/20 p-4 rounded-xl border border-white/5">
                                        {PLATFORMS.map((plat) => (
                                            <div key={plat} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`edit-plat-${plat}`}
                                                    checked={field.value?.includes(plat)}
                                                    onCheckedChange={(checked) => {
                                                        const current = field.value || [];
                                                        if (checked) field.onChange([...current, plat]);
                                                        else field.onChange(current.filter(p => p !== plat));
                                                    }}
                                                    className="border-white/20 data-[state=checked]:bg-[var(--color-piggy-deep-pink)]"
                                                />
                                                <label htmlFor={`edit-plat-${plat}`} className="text-sm text-gray-300 cursor-pointer">{plat}</label>
                                            </div>
                                        ))}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="isListed"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-xl border border-white/10 p-4 bg-black/20">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base font-bold text-white">Public Visibility</FormLabel>
                                        <FormDescription className="text-gray-400 text-xs">
                                            If disabled, the game will be hidden from the library.
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            className="data-[state=checked]:bg-[var(--color-piggy-super-green)]"
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-between items-center pt-6 border-t border-white/10 gap-4">
                            {!isDeleting ? (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setIsDeleting(true)}
                                    className="text-red-400 hover:text-red-500 hover:bg-red-500/10"
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete Game
                                </Button>
                            ) : (
                                <div className="flex items-center gap-3 bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                                    <AlertTriangle className="w-4 h-4 text-red-500" />
                                    <span className="text-xs text-red-400 font-bold">Confirm Delete?</span>
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => deleteMutation.mutate()}
                                        disabled={deleteMutation.isPending}
                                        className="h-8 font-bold"
                                    >
                                        {deleteMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Yes, Delete"}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setIsDeleting(false)}
                                        className="h-8 text-gray-400 hover:text-white"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            )}

                            <div className="flex gap-3 ml-auto">
                                <Button type="button" variant="ghost" onClick={onClose} className="hover:bg-white/10 text-white">
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={updateMutation.isPending}
                                    className="bg-[var(--color-piggy-deep-pink)] hover:bg-[var(--color-piggy-deep-pink)]/80 text-white font-bold px-8"
                                >
                                    {updateMutation.isPending ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                                        </>
                                    ) : (
                                        "Save Changes"
                                    )}
                                </Button>
                            </div>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
