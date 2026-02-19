"use client";

import { useBettingCart } from "@/context/betting-cart-context";
import { Button } from "@/components/ui/button";
import { Coins, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface BettingCartFloatingButtonProps {
    onClick: () => void;
}

export function BettingCartFloatingButton({ onClick }: BettingCartFloatingButtonProps) {
    const { itemCount, totalWager } = useBettingCart();

    if (itemCount === 0) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[60] animate-in fade-in slide-in-from-bottom-10 duration-500">
            <Button
                onClick={onClick}
                className={cn(
                    "h-16 pl-6 pr-4 rounded-full bg-black/60 backdrop-blur-2xl border-2 border-[var(--color-piggy-deep-pink)] shadow-[0_0_30px_rgba(255,10,131,0.4)] hover:bg-black/80 hover:scale-105 transition-all group flex items-center gap-4"
                )}
            >
                <div className="flex flex-col items-start leading-none">
                    <span className="text-piggy-label uppercase font-black tracking-widest text-[var(--color-piggy-deep-pink)]">
                        {itemCount} {itemCount === 1 ? 'BET' : 'BETS'} SELECTED
                    </span>
                    <span className="text-piggy-title font-black text-white tracking-tight">
                        Betslip
                    </span>
                </div>

                <div className="w-10 h-10 rounded-full bg-[var(--color-piggy-deep-pink)] flex items-center justify-center group-hover:bg-white transition-colors">
                    <ChevronUp className="w-6 h-6 text-white group-hover:text-[var(--color-piggy-deep-pink)] transition-colors" />
                </div>
            </Button>
        </div>
    );
}
