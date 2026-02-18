
"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
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
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateMarket } from "@/lib/api/tournaments";
import { Loader2, AlertTriangle, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const outcomeSchema = z.object({
    id: z.string().optional(),
    label: z.string().min(1, "Label is required"),
    weight: z.coerce.number().min(0.1).optional(),
});

const marketSchema = z.object({
    marketQuestion: z.string().min(1, "Question is required"),
    outcomes: z.array(outcomeSchema).optional(),
});

type MarketFormData = z.infer<typeof marketSchema>;

interface MarketEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    market: any;
    tournamentId: string;
}

export function MarketEditModal({ isOpen, onClose, market, tournamentId }: MarketEditModalProps) {
    // Safely get toast with fallback
    let toast: any;
    try {
        const toastHook = useToast();
        toast = toastHook?.toast || (() => { });
    } catch (e) {
        console.error("MarketEditModal useToast error:", e);
        toast = () => { };
    }
    const queryClient = useQueryClient();

    const form = useForm<MarketFormData>({
        resolver: zodResolver(marketSchema) as any,
        defaultValues: {
            marketQuestion: "",
            outcomes: []
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "outcomes",
    });

    // Reset form when market changes or modal opens
    useEffect(() => {
        if (market) {
            form.reset({
                marketQuestion: market.marketQuestion,
                outcomes: market.outcomes.map((o: any) => ({
                    id: o.id,
                    label: o.label,
                    weight: o.weight
                }))
            });
        }
    }, [market, form, isOpen]);

    const mutation = useMutation({
        mutationFn: (data: MarketFormData) => updateMarket(market.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] });
            toast({ title: "Market Updated", description: "Changes saved successfully." });
            onClose();
        },
        onError: (error: Error) => {
            toast({ title: "Update Failed", description: error.message, variant: "destructive" });
        },
    });

    const onSubmit = (data: any) => {
        mutation.mutate(data);
    };

    if (!market) return null;

    // Check if editing outcomes is safe (logic also exists on backend, but good for UI)
    // We assume if _count is available use it, otherwise assume unsafe if unsure, but for now we rely on backend error
    // If we want to be safe, we can pass hasBets prop or check bets array length if loaded.
    // For this UI, we'll try to let them edit.

    // Correction: In TournamentDetailsView, market.outcomes might have betCount or we might not have bet count easily.
    // The backend `market` object in details view has `outcomes` with `betCount` (from lines 83 of market-resolution-modal check).
    // Let's assume we can check outcome.betCount.

    const totalBets = market.outcomes?.reduce((acc: number, o: any) => acc + (o.betCount || 0), 0) || 0;
    const canEditOutcomes = totalBets === 0;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-[#1a1a1a] border-white/10 text-white max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Market</DialogTitle>
                    <DialogDescription>
                        Modify market details.
                        {!canEditOutcomes && (
                            <span className="block mt-2 text-yellow-500 flex items-center gap-2 text-xs">
                                <AlertTriangle className="w-4 h-4" />
                                Bets have been placed. Outcome editing is restricted.
                            </span>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="marketQuestion"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Market Question</FormLabel>
                                    <FormControl>
                                        <Input {...field} className="bg-black/20 border-white/10" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <FormLabel>Outcomes</FormLabel>
                                {market.marketType === 'weighted' && (
                                    <Badge variant="outline" className="text-[10px] border-white/10 text-gray-400">
                                        Weights determine payout multiplier
                                    </Badge>
                                )}
                            </div>

                            {fields.map((field, index) => (
                                <div key={field.id} className="flex gap-2 items-start">
                                    <FormField
                                        control={form.control}
                                        name={`outcomes.${index}.label`}
                                        render={({ field }) => (
                                            <FormItem className="flex-1">
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        placeholder="Label"
                                                        className="bg-black/20 border-white/10 h-9 text-sm"
                                                        // Disable if bets placed, to prevent changing "Yes" to "No" trickery
                                                        disabled={!canEditOutcomes}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {market.marketType === 'weighted' && (
                                        <FormField
                                            control={form.control}
                                            name={`outcomes.${index}.weight`}
                                            render={({ field }) => (
                                                <FormItem className="w-20">
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            type="number"
                                                            step="0.1"
                                                            placeholder="W"
                                                            className="bg-black/20 border-white/10 h-9 text-sm text-center"
                                                            disabled={!canEditOutcomes}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}
                                </div>
                            ))}

                            {!canEditOutcomes && (
                                <p className="text-[10px] text-gray-500 italic text-center">
                                    Outcomes cannot be modified after bets are placed.
                                </p>
                            )}
                        </div>

                        <DialogFooter className="gap-2">
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
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
