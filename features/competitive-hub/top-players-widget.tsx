"use client";

import { getLeaderboard } from "@/lib/api/leaderboard";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, Minus, Loader2 } from "lucide-react";

export function TopPlayersWidget() {
    const { data: leaderboard, isLoading } = useQuery({
        queryKey: ['leaderboard', 'top'],
        queryFn: () => getLeaderboard('all', 5),
    });

    const entries = leaderboard || [];

    if (isLoading) {
        return (
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 h-full flex flex-col items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-[var(--color-piggy-deep-pink)]" />
            </div>
        );
    }

    return (
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white font-mono">Top Players</h3>
                <span className="text-[10px] font-bold text-[var(--color-piggy-deep-pink)] bg-[var(--color-piggy-deep-pink)]/10 px-2.5 py-1 rounded-full border border-[var(--color-piggy-deep-pink)]/20">
                    ALL TIME
                </span>
            </div>

            <div className="flex flex-col gap-3">
                {entries.length > 0 ? (
                    entries.slice(0, 4).map((player, index) => (
                        <div key={index} className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors group">
                            <div className="flex items-center gap-3">
                                <span className="font-mono text-lg font-bold text-gray-500 w-4">{player.rank}</span>
                                <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10">
                                    <img src={player.avatar} alt={player.username} className="w-full h-full object-cover" />
                                </div>
                                <span className="font-mono text-sm font-bold text-white group-hover:text-[var(--color-piggy-deep-pink)] transition-colors">
                                    {player.username}
                                </span>
                            </div>

                            {/* Mock trend for UI consistency until backend supports it */}
                            <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${index === 0 ? 'text-[var(--color-piggy-super-green)] bg-[var(--color-piggy-super-green)]/10' :
                                index === 1 ? 'text-[var(--color-piggy-super-green)] bg-[var(--color-piggy-super-green)]/10' :
                                    'text-gray-400 bg-gray-500/10'
                                }`}>
                                {index < 2 ? <TrendingUp className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-gray-500 text-center py-4 font-mono text-sm">
                        No players ranked yet.
                    </div>
                )}
            </div>
        </div>
    );
}
