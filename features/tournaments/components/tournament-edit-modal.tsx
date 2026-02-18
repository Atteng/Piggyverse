"use client";

import { useState, useMemo } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateTournament } from "@/lib/api/tournaments";
import { Loader2, Lock } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const updateSchema = z.object({
    // Always editable (safe fields) - all optional for partial updates
    name: z.string().optional(),
    description: z.string().optional(),
    rules: z.string().optional(),
    discordLink: z.string().url("Invalid Discord link").optional().or(z.literal("")),
    lobbyUrl: z.string().url("Invalid Lobby link").optional().or(z.literal("")),
    streamLink: z.string().url("Invalid stream link").optional().or(z.literal("")),
    imageUrl: z.string().url("Invalid image URL").optional().or(z.literal("")),
    isPrivate: z.boolean().optional(),

    // Time-locked fields (only editable before tournament starts)
    startDate: z.string().optional(),
    startTime: z.string().optional(),
    maxPlayers: z.coerce.number().optional(),
    entryFeeAmount: z.coerce.number().optional(),
    entryFeeToken: z.string().optional(),
    prizePoolAmount: z.coerce.number().min(0).optional(),
    prizePoolToken: z.string().optional(),

    registrationDeadlineDate: z.string().optional().or(z.literal("")),
    registrationDeadlineTime: z.string().optional().or(z.literal("")),
    hasCustomRegistrationDeadline: z.boolean().optional(),
});

type UpdateFormData = z.infer<typeof updateSchema>;

interface TournamentEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    tournament: {
        id: string;
        name: string;
        description: string;
        rules?: string | string[] | null;
        discordLink?: string | null;
        streamLink?: string | null;
        imageUrl?: string | null;
        lobbyUrl?: string | null;
        isPrivate?: boolean;
        startDate: string;
        startTime?: string;
        maxPlayers: number;
        entryFeeAmount?: number | null;
        entryFeeToken?: string | null;
        prizePoolAmount?: number | null;
        prizePoolToken?: string | null;
        registrationDeadline?: string | Date | null;
    };
}

export function TournamentEditModal({ isOpen, onClose, tournament }: TournamentEditModalProps) {
    // Safely get toast with fallback
    let toast: any;
    try {
        const toastHook = useToast();
        toast = toastHook?.toast || (() => { });
    } catch (e) {
        console.error("TournamentEditModal useToast error:", e);
        toast = () => { };
    }
    const queryClient = useQueryClient();

    // Check if tournament has started (time-locked fields become read-only)
    const tournamentStarted = useMemo(() => {
        return new Date(tournament.startDate) <= new Date();
    }, [tournament.startDate]);

    const form = useForm<UpdateFormData>({
        resolver: zodResolver(updateSchema) as any,
        defaultValues: {
            name: tournament.name,
            description: tournament.description,
            rules: Array.isArray(tournament.rules) ? tournament.rules.join("\n") : (tournament.rules || ""),
            discordLink: tournament.discordLink || "",
            streamLink: tournament.streamLink || "",
            imageUrl: tournament.imageUrl || "",
            lobbyUrl: tournament.lobbyUrl || "",
            isPrivate: tournament.isPrivate || false,
            startDate: tournament.startDate ? new Date(tournament.startDate).toISOString().split('T')[0] : "",
            startTime: tournament.startTime || "",
            maxPlayers: tournament.maxPlayers,
            entryFeeAmount: tournament.entryFeeAmount || 0,
            entryFeeToken: tournament.entryFeeToken || "USDC",
            prizePoolAmount: tournament.prizePoolAmount || 0,
            prizePoolToken: tournament.prizePoolToken || "USDC",
            hasCustomRegistrationDeadline: !!tournament.registrationDeadline,
            registrationDeadlineDate: tournament.registrationDeadline ? new Date(tournament.registrationDeadline).toISOString().split('T')[0] : "",
            registrationDeadlineTime: tournament.registrationDeadline ?
                (() => {
                    const d = new Date(tournament.registrationDeadline);
                    return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
                })() : "",
        },
    });

    const mutation = useMutation({
        mutationFn: (data: UpdateFormData) => updateTournament(tournament.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tournament', tournament.id] });
            toast({ title: "Tournament Updated", description: "Your changes have been saved." });
            onClose();
        },
        onError: (error: Error) => {
            toast({ title: "Update Failed", description: error.message, variant: "destructive" });
        },
    });

    const onSubmit = (data: UpdateFormData) => {
        // Filter out empty/unchanged values - only send what's actually filled
        const updates: Partial<UpdateFormData> = {};

        Object.entries(data).forEach(([key, value]) => {
            // Include if value is not empty/null/undefined
            if (value !== "" && value !== null && value !== undefined) {
                // For numbers, include if > 0 or explicitly 0
                if (typeof value === 'number') {
                    if (value >= 0) {
                        updates[key as keyof UpdateFormData] = value as any;
                    }
                } else if (typeof value === 'boolean') {
                    updates[key as keyof UpdateFormData] = value as any;
                } else if (typeof value === 'string' && value.trim()) {
                    updates[key as keyof UpdateFormData] = value as any;
                }
            }
        });

        // Convert startDate to ISO DateTime if present
        if (updates.startDate) {
            const dateStr = updates.startDate as string;
            const timeStr = updates.startTime || '00:00';
            const dateTime = new Date(`${dateStr}T${timeStr}:00`);
            updates.startDate = dateTime.toISOString() as any;
        }

        // Handle Registration Deadline
        if (data.hasCustomRegistrationDeadline && data.registrationDeadlineDate && data.registrationDeadlineTime) {
            const [regHours, regMins] = data.registrationDeadlineTime.split(':');
            const regDate = new Date(data.registrationDeadlineDate);
            regDate.setHours(parseInt(regHours), parseInt(regMins));
            (updates as any).registrationDeadline = regDate.toISOString();
        } else if (data.hasCustomRegistrationDeadline === false) {
            (updates as any).registrationDeadline = null; // Reset to default (startDate)
        }

        // Remove startTime from updates as it's merged into startDate
        delete updates.startTime;

        mutation.mutate(updates as UpdateFormData);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-black/60 backdrop-blur-3xl border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Tournament</DialogTitle>
                    <DialogDescription>
                        Update the details for your tournament.
                        {tournamentStarted && (
                            <span className="block mt-2 text-yellow-500 flex items-center gap-2">
                                <Lock className="w-4 h-4" />
                                Tournament has started. Financial settings are locked.
                            </span>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* Always Editable Fields */}
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tournament Name</FormLabel>
                                    <FormControl>
                                        <Input {...field} className="bg-black/60 border-white/10" />
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
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea {...field} className="bg-black/20 border-white/10 min-h-[100px]" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="rules"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Rules</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            {...field}
                                            placeholder="Enter rules (one per line)"
                                            className="bg-black/20 border-white/10 min-h-[100px]"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="imageUrl"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Banner Image URL</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="https://..." className="bg-black/60 border-white/10" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="discordLink"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Discord Link</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="https://discord.gg/..." className="bg-black/60 border-white/10" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="streamLink"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Stream Link</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="https://twitch.tv/..." className="bg-black/60 border-white/10" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="lobbyUrl"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Lobby / Join Link</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="https://game-lobby.com/..." className="bg-black/60 border-white/10" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="isPrivate"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-white/10 p-4 bg-black/20">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">Private Tournament</FormLabel>
                                        <FormDescription className="text-white/60">
                                            Only visible to invited players
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        {/* Time-Locked Fields */}
                        <div className="border-t border-white/10 pt-4 mt-6">
                            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                                {tournamentStarted && <Lock className="w-4 h-4 text-yellow-500" />}
                                Tournament Settings
                                {tournamentStarted && <span className="text-xs text-yellow-500">(Locked)</span>}
                            </h3>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="startDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Start Date</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    type="date"
                                                    disabled={tournamentStarted}
                                                    className="bg-black/20 border-white/10 disabled:opacity-50"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="startTime"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-white">Start Time</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="time"
                                                    {...field}
                                                    className="bg-black/40 border-white/10 text-white [color-scheme:dark]"
                                                    disabled={tournamentStarted}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="space-y-4 p-4 border border-white/10 rounded-xl bg-white/5">
                                <FormField
                                    control={form.control}
                                    name="hasCustomRegistrationDeadline"
                                    render={({ field }) => (
                                        <FormItem className="flex items-center justify-between space-y-0">
                                            <div>
                                                <FormLabel className="text-white text-sm font-bold">Custom Registration Deadline</FormLabel>
                                                <FormDescription className="text-[10px] text-gray-500">
                                                    Allow late entry or close registration early.
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                {form.watch("hasCustomRegistrationDeadline") && (
                                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
                                        <FormField
                                            control={form.control}
                                            name="registrationDeadlineDate"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[10px] text-gray-400">Deadline Date</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="date"
                                                            {...field}
                                                            className="h-9 bg-black/40 border-white/10 text-white text-xs [color-scheme:dark]"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="registrationDeadlineTime"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[10px] text-gray-400">Deadline Time</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="time"
                                                            {...field}
                                                            className="h-9 bg-black/40 border-white/10 text-white text-xs [color-scheme:dark]"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                )}
                            </div>

                            <FormField
                                control={form.control}
                                name="maxPlayers"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Max Players</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                type="number"
                                                min={2}
                                                disabled={tournamentStarted}
                                                className="bg-black/20 border-white/10 disabled:opacity-50"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="entryFeeAmount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Entry Fee Amount</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    type="number"
                                                    min={0}
                                                    step="0.01"
                                                    disabled={tournamentStarted}
                                                    className="bg-black/20 border-white/10 disabled:opacity-50"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="entryFeeToken"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Entry Fee Token</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                disabled={tournamentStarted}
                                            >
                                                <FormControl>
                                                    <SelectTrigger className="bg-black/20 border-white/10 disabled:opacity-50">
                                                        <SelectValue placeholder="Select token" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                                                    <SelectItem value="USDC">USDC</SelectItem>
                                                    <SelectItem value="PIGGY">PIGGY</SelectItem>
                                                    <SelectItem value="UP">UP</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="prizePoolAmount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Prize Pool Amount</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    type="number"
                                                    min={0}
                                                    step="0.01"
                                                    disabled={tournamentStarted}
                                                    className="bg-black/20 border-white/10 disabled:opacity-50"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="prizePoolToken"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Prize Pool Token</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                disabled={tournamentStarted}
                                            >
                                                <FormControl>
                                                    <SelectTrigger className="bg-black/20 border-white/10 disabled:opacity-50">
                                                        <SelectValue placeholder="Select token" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                                                    <SelectItem value="USDC">USDC</SelectItem>
                                                    <SelectItem value="PIGGY">PIGGY</SelectItem>
                                                    <SelectItem value="UP">UP</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button type="button" variant="ghost" onClick={onClose} className="hover:bg-white/10 hover:text-white">
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={mutation.isPending}
                                className="bg-[var(--color-piggy-deep-pink)] hover:bg-[var(--color-piggy-deep-pink)]/80 text-white font-bold"
                            >
                                {mutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                                    </>
                                ) : (
                                    "Save Changes"
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
