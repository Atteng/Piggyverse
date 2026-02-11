"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Coins, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import { placeBet } from "@/lib/api/betting";
import { useToast } from "@/hooks/use-toast";
import { useBettingOdds } from "@/hooks/use-betting-odds";

interface BetPlacementModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    marketId: string;
    outcomeId: string;
    tournamentName: string;
    outcomeName: string;
    odds: number;
    minBet?: number;
    maxBet?: number;
    token?: string;
}

export function BetPlacementModal({
    open,
    onOpenChange,
    marketId,
    outcomeId,
    tournamentName,
    outcomeName,
    odds: initialOdds,
    minBet = 0,
    maxBet,
    token = "USDC"
}: BetPlacementModalProps) {
    const [amount, setAmount] = useState<string>("");
    const [step, setStep] = useState<"input" | "confirm" | "success">("input");
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Subscribe to live odds
    const { odds: liveOdds } = useBettingOdds(marketId);

    // Determine current odds: use live if available, fall back to initial prop
    const currentOutcomeParams = liveOdds.find(o => o.outcomeId === outcomeId);
    const currentOdds = currentOutcomeParams ? currentOutcomeParams.currentOdds : initialOdds;

    const betAmount = parseFloat(amount) || 0;
    const potentialPayout = betAmount * currentOdds;

    const placeBetMutation = useMutation({
        mutationFn: () => placeBet({
            marketId,
            outcomeId,
            amount: betAmount,
            token
        }),
        onSuccess: () => {
            // ... rest of the function
            setStep("success");
            queryClient.invalidateQueries({ queryKey: ['betting', 'market', marketId] });
            queryClient.invalidateQueries({ queryKey: ['betting', 'bets'] });
        },
        onError: (error: Error) => {
            toast({
                title: "Bet Failed",
                description: error.message,
                variant: "destructive"
            });
        }
    });

    const handlePlaceBet = () => {
        placeBetMutation.mutate();
    };

    const reset = () => {
        setStep("input");
        setAmount("");
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!val && !placeBetMutation.isPending) {
                reset();
            }
        }}>
            <DialogContent className="bg-[#1a1a1a] border border-white/10 text-white sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold font-mono">
                        <Coins className="text-[var(--color-piggy-deep-pink)]" />
                        Place Bet
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                        {tournamentName}
                    </DialogDescription>
                </DialogHeader>

                {step === "input" && (
                    <div className="space-y-6 py-4">
                        <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Betting On</span>
                                <span className="font-bold text-white">{outcomeName}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Current Odds</span>
                                <span className="font-bold text-[var(--color-piggy-super-green)] font-mono">x{currentOdds.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-xs text-gray-400">
                                <span>Wager Amount</span>
                                {minBet > 0 && <span>Min: {minBet} {token}</span>}
                            </div>
                            <div className="relative">
                                <Input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="h-12 pl-4 pr-20 bg-black/50 border-white/10 focus:border-[var(--color-piggy-deep-pink)] text-lg font-mono"
                                    placeholder="0.00"
                                    min={minBet}
                                    max={maxBet}
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold bg-white/10 px-2 py-1 rounded">
                                    {token}
                                </div>
                            </div>
                        </div>

                        {betAmount > 0 && (
                            <div className="bg-[var(--color-piggy-super-green)]/10 border border-[var(--color-piggy-super-green)]/20 p-4 rounded-xl">
                                <div className="flex justify-between items-center">
                                    <span className="text-[var(--color-piggy-super-green)] text-sm flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4" /> Potential Payout
                                    </span>
                                    <span className="text-xl font-black text-white font-mono">
                                        {potentialPayout.toFixed(2)} {token}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {step === "confirm" && (
                    <div className="space-y-6 py-4">
                        <div className="text-center space-y-2">
                            <AlertCircle className="w-12 h-12 text-[var(--color-piggy-deep-pink)] mx-auto" />
                            <h3 className="text-lg font-bold">Confirm Your Bet</h3>
                            <p className="text-sm text-gray-400 px-6">
                                You are betting <strong>{amount} {token}</strong> on <strong>{outcomeName}</strong> at <strong>x{currentOdds.toFixed(2)}</strong> odds.
                            </p>
                        </div>

                        <div className="bg-white/5 p-4 rounded-xl space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-400">Total Wager</span>
                                <span className="text-white font-bold">{amount} {token}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Potential Return</span>
                                <span className="text-[var(--color-piggy-super-green)] font-bold">+{(potentialPayout - betAmount).toFixed(2)} {token}</span>
                            </div>
                        </div>
                    </div>
                )}

                {step === "success" && (
                    <div className="space-y-6 py-8 text-center animate-in zoom-in-95 duration-300">
                        <div className="w-16 h-16 bg-[var(--color-piggy-super-green)]/20 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle2 className="w-8 h-8 text-[var(--color-piggy-super-green)]" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-white mb-2">Bet Placed!</h3>
                            <p className="text-gray-400">Good luck! You can track this bet in your profile.</p>
                        </div>
                    </div>
                )}

                <DialogFooter className="gap-2 sm:gap-0">
                    {step === "input" && (
                        <Button
                            className="w-full bg-[var(--color-piggy-deep-pink)] hover:bg-[var(--color-piggy-deep-pink)]/80 text-white font-bold"
                            disabled={!betAmount || betAmount < minBet || (maxBet !== undefined && betAmount > maxBet)}
                            onClick={() => setStep("confirm")}
                        >
                            Review Bet
                        </Button>
                    )}

                    {step === "confirm" && (
                        <div className="flex gap-3 w-full">
                            <Button variant="ghost" className="flex-1" onClick={() => setStep("input")}>Cancel</Button>
                            <Button
                                className="flex-1 bg-[var(--color-piggy-super-green)] hover:bg-[var(--color-piggy-super-green)]/80 text-black font-bold"
                                onClick={handlePlaceBet}
                                disabled={placeBetMutation.isPending}
                            >
                                {placeBetMutation.isPending ? "Placing Bet..." : "Confirm Bet"}
                            </Button>
                        </div>
                    )}

                    {step === "success" && (
                        <Button
                            className="w-full bg-white/10 hover:bg-white/20 text-white font-bold"
                            onClick={reset}
                        >
                            Close
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
