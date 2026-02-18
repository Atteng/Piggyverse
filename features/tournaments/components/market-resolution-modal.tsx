"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { resolveMarket } from "@/lib/api/tournaments";
import { useToast } from "@/hooks/use-toast";

interface MarketResolutionModalProps {
    isOpen: boolean;
    onClose: () => void;
    market: any;
    tournamentId: string;
}

export function MarketResolutionModal({ isOpen, onClose, market, tournamentId }: MarketResolutionModalProps) {
    // Safely get toast with fallback
    let toast: any;
    try {
        const toastHook = useToast();
        toast = toastHook?.toast || (() => { });
    } catch (e) {
        console.error("MarketResolutionModal useToast error:", e);
        toast = () => { };
    }
    const queryClient = useQueryClient();
    const [selectedOutcomeId, setSelectedOutcomeId] = useState<string>("");

    const resolveMutation = useMutation({
        mutationFn: async () => {
            if (!selectedOutcomeId) throw new Error("Please select a winning outcome");
            return resolveMarket(market.id, selectedOutcomeId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] });
            toast({
                title: "Market Resolved",
                description: "Payouts are being processed.",
            });
            onClose();
        },
        onError: (error: Error) => {
            toast({
                title: "Resolution Failed",
                description: error.message,
                variant: "destructive"
            });
        }
    });

    if (!market) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-[#1a1a1a] border border-white/10 text-white sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-[var(--color-piggy-deep-pink)]" />
                        Resolve Market
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                        Select the winning outcome for: <br />
                        <span className="text-white font-bold">"{market.marketQuestion}"</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-4 flex gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" />
                        <div className="text-xs text-yellow-200/80">
                            <strong>Warning:</strong> This action cannot be undone. Once resolved, payouts are distributed immediately to winning bettors.
                        </div>
                    </div>

                    <RadioGroup
                        value={selectedOutcomeId}
                        onValueChange={setSelectedOutcomeId}
                        className="space-y-3"
                    >
                        {market.outcomes.map((outcome: any) => (
                            <div key={outcome.id} className="flex items-center space-x-3 bg-white/5 p-3 rounded-lg border border-white/5 hover:border-white/20 transition-colors">
                                <RadioGroupItem value={outcome.id} id={outcome.id} className="border-white/30 text-[var(--color-piggy-deep-pink)]" />
                                <Label htmlFor={outcome.id} className="flex-1 cursor-pointer font-bold text-gray-200">
                                    {outcome.label}
                                </Label>
                                <span className="text-xs font-mono text-gray-500">
                                    {outcome.betCount} bets
                                </span>
                            </div>
                        ))}
                    </RadioGroup>
                </div>

                <DialogFooter className="sm:justify-between gap-2">
                    <Button variant="ghost" onClick={onClose} className="hover:bg-white/10 text-gray-400 hover:text-white">
                        Cancel
                    </Button>
                    <Button
                        onClick={() => resolveMutation.mutate()}
                        disabled={!selectedOutcomeId || resolveMutation.isPending}
                        className="bg-[var(--color-piggy-deep-pink)] hover:bg-[var(--color-piggy-deep-pink)]/80 text-white font-bold"
                    >
                        {resolveMutation.isPending ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Resolving...
                            </>
                        ) : (
                            "Confirm Winner"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
