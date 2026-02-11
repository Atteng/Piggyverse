"use client";

import { getUserProfile } from "@/lib/api/users";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

export function YourStats() {
    const { data: userProfile, isLoading } = useQuery({
        queryKey: ['user', 'me'],
        queryFn: getUserProfile,
        retry: false, // Don't retry on 401
    });

    // Default to 0 values if not logged in or loading
    const stats = userProfile?.stats || {
        winRate: 0,
        totalHoursPlayed: 0,
        tournamentsWon: 0,
        tokensEarned: 0,
        totalMatchesWon: 0, // Used for calculation if needed
    };

    // Calculate win rate safely
    const winRate = stats.totalMatchesWon > 0
        ? Math.round((stats.totalMatchesWon / (stats.totalMatchesWon * 2)) * 100) // Placeholder logic until totalMatchesPlayed is tracked
        : 0;

    if (isLoading) {
        return (
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-4 h-full flex flex-col justify-center items-center">
                <Loader2 className="w-6 h-6 animate-spin text-[var(--color-piggy-deep-pink)]" />
            </div>
        );
    }

    return (
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-4 h-full flex flex-col justify-center">
            <h3 className="text-xl font-bold text-white mb-4 font-mono">Your Stats</h3>

            <div className="grid grid-cols-4 gap-2">
                <div className="aspect-square bg-black/40 border border-white/10 rounded-xl p-2 flex flex-col items-center justify-center group hover:border-[var(--color-piggy-deep-pink)]/50 transition-colors">
                    <div className="text-lg font-bold text-white font-mono group-hover:text-[var(--color-piggy-deep-pink)] transition-colors leading-none">{winRate}%</div>
                    <div className="text-[9px] text-gray-400 mt-1 font-medium tracking-wide text-center uppercase leading-tight">Win Rate</div>
                </div>

                <div className="aspect-square bg-black/40 border border-white/10 rounded-xl p-2 flex flex-col items-center justify-center group hover:border-[var(--color-piggy-deep-pink)]/50 transition-colors">
                    <div className="text-lg font-bold text-white font-mono group-hover:text-[var(--color-piggy-deep-pink)] transition-colors leading-none">{stats.totalHoursPlayed}</div>
                    <div className="text-[9px] text-gray-400 mt-1 font-medium tracking-wide text-center uppercase leading-tight">Hours</div>
                </div>

                <div className="aspect-square bg-black/40 border border-white/10 rounded-xl p-2 flex flex-col items-center justify-center group hover:border-[var(--color-piggy-deep-pink)]/50 transition-colors">
                    <div className="text-lg font-bold text-white font-mono group-hover:text-[var(--color-piggy-deep-pink)] transition-colors leading-none">{stats.tournamentsWon}</div>
                    <div className="text-[9px] text-gray-400 mt-1 font-medium tracking-wide text-center uppercase leading-tight">Wins</div>
                </div>

                <div className="aspect-square bg-black/40 border border-white/10 rounded-xl p-2 flex flex-col items-center justify-center group hover:border-[var(--color-piggy-deep-pink)]/50 transition-colors">
                    <div className="text-lg font-bold text-white font-mono group-hover:text-[var(--color-piggy-deep-pink)] transition-colors leading-none">{stats.tokensEarned}</div>
                    <div className="text-[9px] text-gray-400 mt-1 font-medium tracking-wide text-center uppercase leading-tight">Tokens</div>
                </div>
            </div>
        </div>
    );
}
