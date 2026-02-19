"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "../../../components/ui/sheet";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { ScrollArea } from "../../../components/ui/scroll-area";
import { useBettingCart } from "@/context/betting-cart-context";
import { Trash2, Coins, TrendingUp, X, ChevronRight, AlertTriangle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "../../../components/ui/badge";

interface BettingCartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onCheckout: () => void;
    tournament?: any; // Accept tournament data to check for live odds/status
}

export function BettingCartDrawer({ isOpen, onClose, onCheckout, tournament }: BettingCartDrawerProps) {
    const { items, removeFromSlip, updateAmount, updateOdds, clearSlip, totalWager, itemCount, cartToken } = useBettingCart();

    // Calculate totals based on LIVE odds if available, otherwise stored odds
    const calculatedItems = items.map(item => {
        let currentOdds = item.odds;
        let isSuspended = false;
        let oddsChanged = false;
        let trend: 'up' | 'down' | 'same' = 'same';

        if (tournament && tournament.bettingMarkets) {
            const market = tournament.bettingMarkets.find((m: any) => m.id === item.marketId);
            if (market) {
                if (market.status !== 'OPEN' || market.isPaused) {
                    isSuspended = true;
                }
                const outcome = market.outcomes.find((o: any) => o.id === item.outcomeId);
                if (outcome) {
                    const liveOdds = outcome.currentOdds || outcome.weight || 1.0;
                    // Check for odds difference (using small epsilon for float usage)
                    if (Math.abs(liveOdds - item.odds) > 0.001) {
                        oddsChanged = true;
                        trend = liveOdds > item.odds ? 'up' : 'down';
                        currentOdds = liveOdds;
                    }
                }
            }
        }

        return {
            ...item,
            currentOdds,
            isSuspended,
            oddsChanged,
            trend
        };
    });

    const potentialReturns = calculatedItems.reduce((sum, item) => sum + (item.amount * item.currentOdds), 0);
    const potentialProfit = potentialReturns - totalWager;
    const hasSuspendedItems = calculatedItems.some(i => i.isSuspended);
    const hasOddsChanged = calculatedItems.some(i => i.oddsChanged);

    const handleAcceptChanges = () => {
        calculatedItems.forEach(item => {
            if (item.oddsChanged) {
                updateOdds(item.outcomeId, item.currentOdds);
            }
        });
    };

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent
                side="right"
                className="w-full sm:max-w-md bg-black/90 backdrop-blur-3xl border-white/10 text-white p-0 flex flex-col shadow-2xl h-[100dvh] overflow-hidden"
            >
                {/* Header */}
                <SheetHeader className="p-6 pb-4 border-b border-white/5 bg-black/40">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-[var(--color-piggy-deep-pink)]/20 p-2 rounded-xl">
                                <Coins className="w-5 h-5 text-[var(--color-piggy-deep-pink)]" />
                            </div>
                            <div>
                                <SheetTitle className="text-piggy-title font-black text-white uppercase tracking-tighter leading-none">
                                    Betting Slip
                                </SheetTitle>
                                <SheetDescription className="text-piggy-tiny text-gray-400 font-mono font-medium uppercase tracking-widest mt-0.5">
                                    {itemCount} {itemCount === 1 ? 'Selection' : 'Selections'}
                                </SheetDescription>
                            </div>
                        </div>
                        {/* Default SheetClose is sufficient, removed duplicate button */}
                    </div>

                    {/* Notification Bar */}
                    {itemCount > 0 && (
                        <div className="mt-4 bg-[var(--color-piggy-deep-pink)]/10 border border-[var(--color-piggy-deep-pink)]/20 rounded-lg p-2.5 flex items-start gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                            <AlertTriangle className="w-3.5 h-3.5 text-[var(--color-piggy-deep-pink)] mt-0.5 shrink-0" />
                            <p className="text-[10px] text-gray-300 leading-tight">
                                <span className="font-bold text-[var(--color-piggy-deep-pink)] uppercase">Note:</span> Odds are live and subject to change. Suspended markets cannot be bet on.
                            </p>
                        </div>
                    )}
                </SheetHeader>

                <ScrollArea className="flex-1 min-h-0 px-4 md:px-6 bg-[#0a0a0a]">
                    {itemCount === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full py-20 text-center space-y-6 opacity-60">
                            <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center animate-pulse">
                                <Coins className="w-8 h-8 text-gray-600" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-gray-300 uppercase tracking-wide">Your slip is empty</p>
                                <p className="text-xs text-gray-500 max-w-[220px] mx-auto leading-relaxed">
                                    Select outcomes from the tournament markets to build your bet slip.
                                </p>
                            </div>
                            <Button variant="outline" onClick={onClose} className="border-white/10 text-xs uppercase font-bold tracking-wider">
                                Start Betting
                            </Button>
                        </div>
                    ) : (
                        <div className="py-6 space-y-4">
                            {calculatedItems.map((item) => (
                                <div key={item.outcomeId} className={cn(
                                    "group relative bg-[#111] p-4 rounded-xl border transition-all shadow-lg animate-in slide-in-from-right-4 duration-300 fill-mode-backwards",
                                    item.isSuspended ? "border-red-500/30 opacity-75" : "border-white/5 hover:border-white/10"
                                )}>
                                    {/* Prominent Delete Button */}
                                    <button
                                        onClick={() => removeFromSlip(item.outcomeId)}
                                        className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-500 flex items-center justify-center transition-colors z-20"
                                        title="Remove Selection"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>

                                    {/* Suspended Overlay */}
                                    {item.isSuspended && (
                                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] z-10 rounded-xl flex items-center justify-center">
                                            <span className="bg-red-500 text-white font-black text-xs uppercase px-3 py-1 rounded-full tracking-widest shadow-lg transform -rotate-12 border border-white/20">
                                                Suspended
                                            </span>
                                        </div>
                                    )}

                                    <div className="space-y-3 pr-8">
                                        {/* Header Info */}
                                        <div className="space-y-0.5">
                                            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest truncate max-w-[85%]">
                                                {item.tournamentName}
                                            </p>
                                            <p className="text-sm font-bold text-white leading-tight line-clamp-2 pr-2">
                                                {item.marketQuestion}
                                            </p>
                                        </div>

                                        {/* Outcome & Odds Box */}
                                        <div className="flex items-center justify-between gap-3 bg-black/40 rounded-lg p-2 border border-white/5">
                                            <span className="text-xs font-bold text-[var(--color-piggy-deep-pink)] truncate max-w-[60%]">
                                                {item.outcomeLabel}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                {item.oddsChanged && (
                                                    <span className={cn(
                                                        "text-[9px] font-bold uppercase tracking-wide animate-pulse",
                                                        item.trend === 'up' ? "text-[var(--color-piggy-super-green)]" : "text-red-400"
                                                    )}>
                                                        {item.trend === 'up' ? '▲ Odds Up' : '▼ Odds Down'}
                                                    </span>
                                                )}
                                                <Badge variant="outline" className={cn(
                                                    "border-[var(--color-piggy-super-green)]/30 text-[var(--color-piggy-super-green)] bg-[var(--color-piggy-super-green)]/5 font-mono text-[10px] h-5 px-1.5 transition-colors",
                                                    item.oddsChanged && "bg-[var(--color-piggy-super-green)]/20 border-[var(--color-piggy-super-green)] text-white"
                                                )}>
                                                    {item.currentOdds.toFixed(2)}x
                                                </Badge>
                                            </div>
                                        </div>

                                        {/* Wager Input Row */}
                                        <div className="grid grid-cols-[1.2fr_1fr] gap-3 items-end pt-1">
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] uppercase font-bold text-gray-500 tracking-widest pl-1">Wager ({item.token || 'USDC'})</label>
                                                <div className="relative">
                                                    <Input
                                                        type="number"
                                                        inputMode="decimal"
                                                        min={0}
                                                        value={item.amount || ""}
                                                        onChange={(e) => updateAmount(item.outcomeId, parseFloat(e.target.value))}
                                                        disabled={item.isSuspended}
                                                        className="h-9 bg-white/5 border-white/10 focus:border-[var(--color-piggy-deep-pink)]/50 focus:ring-1 focus:ring-[var(--color-piggy-deep-pink)]/50 text-white font-mono text-sm pl-3 pr-2 rounded-lg transition-all disabled:opacity-50"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5 text-right">
                                                <label className="text-[9px] uppercase font-bold text-gray-500 tracking-widest pr-1">Est. Return</label>
                                                <div className="h-9 flex items-center justify-end px-2 bg-[var(--color-piggy-super-green)]/5 rounded-lg border border-[var(--color-piggy-super-green)]/10 text-[var(--color-piggy-super-green)] text-sm font-mono font-bold">
                                                    +{(item.amount * item.currentOdds).toFixed(2)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {itemCount > 1 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={clearSlip}
                                    className="w-full mt-4 border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 text-xs font-bold uppercase tracking-widest h-8"
                                >
                                    <Trash2 className="w-3 h-3 mr-2" /> Clear Betting Slip
                                </Button>
                            )}
                        </div>
                    )}
                </ScrollArea>

                {/* Footer */}
                {itemCount > 0 && (
                    <div className="p-6 border-t border-white/10 bg-[#0F0F0F] space-y-5 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-20">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block">Total Wager</span>
                                <span className="text-xl font-black text-white font-mono tracking-tight block">
                                    {totalWager.toFixed(2)} <span className="text-xs text-gray-600 font-bold ml-0.5">{cartToken || 'USDC'}</span>
                                </span>
                            </div>
                            <div className="space-y-1 text-right">
                                <span className="text-[10px] text-[var(--color-piggy-super-green)] font-bold uppercase tracking-widest block flex items-center justify-end gap-1">
                                    <TrendingUp className="w-3 h-3" /> Potential Profit
                                </span>
                                <span className="text-xl font-black text-[var(--color-piggy-super-green)] font-mono tracking-tight block drop-shadow-[0_0_8px_rgba(34,197,94,0.3)]">
                                    {potentialProfit >= 0 ? "+" : ""}{potentialProfit.toFixed(2)}
                                </span>
                            </div>
                        </div>

                        <Button
                            disabled={totalWager <= 0 || hasSuspendedItems}
                            onClick={hasOddsChanged ? handleAcceptChanges : onCheckout}
                            className={cn(
                                "w-full h-12 text-white font-black text-sm uppercase tracking-widest rounded-xl shadow-[0_0_20px_rgba(255,47,122,0.3)] hover:shadow-[0_0_30px_rgba(255,47,122,0.5)] transition-all flex items-center justify-between px-6 group disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none",
                                hasOddsChanged ? "bg-[var(--color-piggy-super-green)] hover:bg-[var(--color-piggy-super-green)]/90 text-black shadow-[0_0_20px_rgba(156,229,0,0.3)]" : "bg-[var(--color-piggy-deep-pink)] hover:bg-[var(--color-piggy-deep-pink)]/90"
                            )}
                        >
                            <span>{hasSuspendedItems ? "Markets Suspended" : hasOddsChanged ? "Accept Changes" : "Proceed to Payment"}</span>
                            {!hasSuspendedItems && (
                                <div className={cn(
                                    "w-6 h-6 rounded-full flex items-center justify-center transition-colors",
                                    hasOddsChanged ? "bg-black/10 group-hover:bg-black/20" : "bg-white/20 group-hover:bg-white/30"
                                )}>
                                    <ArrowRight className={cn("w-3.5 h-3.5", hasOddsChanged ? "text-black" : "text-white")} />
                                </div>
                            )}
                        </Button>

                        <p className="text-[9px] text-center text-gray-600 font-bold uppercase tracking-tight flex items-center justify-center gap-1.5 opacity-60">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            Price updates are live
                        </p>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
