"use client";

import { useState } from "react";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createMarket } from "@/lib/api/tournaments";
import { Loader2, Plus, Trash2, Coins, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const outcomeSchema = z.object({
    label: z.string().min(1, "Label is required"),
    weight: z.coerce.number().min(0.1).optional(),
});

const marketSchema = z.object({
    tournamentId: z.string(),
    marketType: z.enum(["PARIMUTUEL", "WEIGHTED", "BINARY", "SCORE"]),
    marketQuestion: z.string().min(1, "Question is required"),
    poolPreSeed: z.coerce.number().min(0),
    poolPreSeedToken: z.string().default("USDC"),
    minBet: z.coerce.number().min(1).default(1),
    maxBet: z.coerce.number().optional(),
    bookmakingFee: z.coerce.number().min(0).max(100).default(0),
    outcomes: z.array(outcomeSchema).min(1, "At least one outcome is required"),
});

type MarketFormData = z.infer<typeof marketSchema>;

interface MarketCreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    tournamentId: string;
}

export function MarketCreateModal({ isOpen, onClose, tournamentId }: MarketCreateModalProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const form = useForm<MarketFormData>({
        resolver: zodResolver(marketSchema) as any,
        defaultValues: {
            tournamentId,
            marketType: "PARIMUTUEL",
            marketQuestion: "",
            poolPreSeed: 0,
            poolPreSeedToken: "USDC",
            minBet: 1,
            bookmakingFee: 0,
            outcomes: [{ label: "" }]
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "outcomes",
    });

    const watchMarketType = form.watch("marketType");

    // Auto-populate outcomes for BINARY type
    const handleTypeChange = (value: string) => {
        form.setValue("marketType", value as any);
        if (value === "BINARY") {
            form.setValue("outcomes", [
                { label: "YES" },
                { label: "NO" }
            ]);
        } else if (value === "SCORE") {
            form.setValue("outcomes", [
                { label: "Final Score" }
            ]);
        }
    };

    const mutation = useMutation({
        mutationFn: (data: MarketFormData) => createMarket(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] });
            toast({ title: "Market Created", description: "New betting market added to tournament." });
            form.reset({
                tournamentId,
                marketType: "PARIMUTUEL",
                marketQuestion: "",
                poolPreSeed: 0,
                poolPreSeedToken: "USDC",
                minBet: 1,
                bookmakingFee: 0,
                outcomes: [{ label: "" }]
            });
            onClose();
        },
        onError: (error: Error) => {
            toast({ title: "Creation Failed", description: error.message, variant: "destructive" });
        },
    });

    const onSubmit = (data: MarketFormData) => {
        mutation.mutate(data);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-black/60 backdrop-blur-3xl border-white/10 text-white w-[95vw] max-w-lg rounded-[var(--radius-piggy-modal)] max-h-[90vh] overflow-y-auto px-6 py-8 gap-0">
                <DialogHeader className="mb-6">
                    <DialogTitle className="text-piggy-title font-black tracking-tighter text-[var(--color-piggy-deep-pink)]">
                        Create New Market
                    </DialogTitle>
                    <DialogDescription className="text-gray-400 text-piggy-label font-medium uppercase tracking-tight">
                        Add a new betting event to this tournament.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="marketType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Market Type</FormLabel>
                                    <Select
                                        onValueChange={handleTypeChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="bg-black/40 border-white/10 text-white h-11">
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                                            <SelectItem value="PARIMUTUEL">Parimutuel (Shared Pool)</SelectItem>
                                            <SelectItem value="WEIGHTED">Weighted (Fixed Odds)</SelectItem>
                                            <SelectItem value="BINARY">Binary (Yes/No)</SelectItem>
                                            <SelectItem value="SCORE">Score Prediction</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="marketQuestion"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Market Question</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="e.g. Who will win Match 1?"
                                            {...field}
                                            className="bg-black/40 border-white/10 h-11"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="poolPreSeed"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Initial Pool Seed</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    {...field}
                                                    className="bg-black/40 border-white/10 h-11 pl-9"
                                                />
                                                <Coins className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="minBet"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Minimum Bet</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                {...field}
                                                className="bg-black/40 border-white/10 h-11"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="space-y-3 pt-2">
                            <div className="flex items-center justify-between">
                                <FormLabel>Outcomes</FormLabel>
                                {watchMarketType !== "BINARY" && watchMarketType !== "SCORE" && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => append({ label: "" })}
                                        className="h-8 border-white/10 hover:bg-white/5 gap-1"
                                    >
                                        <Plus className="w-3 h-3" /> Add
                                    </Button>
                                )}
                            </div>

                            {watchMarketType === "BINARY" && (
                                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                                    <p className="text-xs text-blue-300 flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4" />
                                        Binary markets are locked to YES and NO.
                                    </p>
                                </div>
                            )}

                            <div className="space-y-2">
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
                                                            placeholder="Outcome Label (e.g. Player A)"
                                                            className="bg-black/20 border-white/10 h-10 text-piggy-body"
                                                            disabled={watchMarketType === "BINARY"}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {watchMarketType === "WEIGHTED" && (
                                            <FormField
                                                control={form.control}
                                                name={`outcomes.${index}.weight`}
                                                render={({ field }) => (
                                                    <FormItem className="w-24">
                                                        <FormControl>
                                                            <Input
                                                                {...field}
                                                                type="number"
                                                                step="0.1"
                                                                placeholder="Odds"
                                                                className="bg-black/20 border-white/10 h-10 text-piggy-body text-center"
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        )}

                                        {fields.length > 1 && watchMarketType !== "BINARY" && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => remove(index)}
                                                className="h-10 w-10 text-gray-500 hover:text-red-400"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <DialogFooter className="pt-6 gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={onClose}
                                className="hover:bg-white/10 text-gray-400"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={mutation.isPending}
                                className="bg-[var(--color-piggy-deep-pink)] hover:bg-[var(--color-piggy-deep-pink)]/80 text-white font-bold"
                            >
                                {mutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                                    </>
                                ) : (
                                    "Launch Market"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
