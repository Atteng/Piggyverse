"use client";

import { useState } from "react";
import { getGames } from "@/lib/api/games";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, Minus, Loader2, Settings } from "lucide-react";
import { useSession } from "next-auth/react";
import { GameEditModal } from "@/features/library/game-edit-modal";
import { Button } from "@/components/ui/button";

export function TopAppsWidget() {
    const { data: session } = useSession();
    const [editingGame, setEditingGame] = useState<any>(null);

    // In a real scenario, we'd request sorted by popularity/players
    const { data, isLoading } = useQuery({
        queryKey: ['games', 'top'],
        queryFn: () => getGames({ limit: 4 }), // We really want a sort here, but basic list works for now
    });

    const games = data?.games || [];

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
                <h3 className="text-xl font-bold text-white font-mono">Top Apps</h3>
                <span className="text-[10px] font-bold text-[var(--color-piggy-deep-pink)] bg-[var(--color-piggy-deep-pink)]/10 px-2.5 py-1 rounded-full border border-[var(--color-piggy-deep-pink)]/20">
                    WEEKLY
                </span>
            </div>

            <div className="flex flex-col gap-3">
                {games.length > 0 ? (
                    games.map((game, index) => {
                        const isOwner = session?.user?.id === game.createdById;

                        return (
                            <div key={game.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors group">
                                <div className="flex items-center gap-3">
                                    <span className="font-mono text-lg font-bold text-gray-500 w-4">{index + 1}</span>
                                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10">
                                        <img src={game.thumbnail} alt={game.title} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-mono text-sm font-bold text-white group-hover:text-[var(--color-piggy-deep-pink)] transition-colors truncate max-w-[120px]">
                                            {game.title}
                                        </span>
                                        {isOwner && (
                                            <button
                                                onClick={() => setEditingGame(game)}
                                                className="text-[10px] text-gray-500 hover:text-[var(--color-piggy-deep-pink)] font-bold flex items-center gap-1 transition-colors"
                                            >
                                                <Settings className="w-3 h-3" /> Edit
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Mock trend for UI consistency */}
                                <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${index < 2 ? 'text-[var(--color-piggy-super-green)] bg-[var(--color-piggy-super-green)]/10' :
                                    'text-gray-400 bg-gray-500/10'
                                    }`}>
                                    {index < 2 ? <TrendingUp className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-gray-500 text-center py-4 font-mono text-sm">
                        No apps available yet.
                    </div>
                )}
            </div>

            {editingGame && (
                <GameEditModal
                    isOpen={!!editingGame}
                    onClose={() => setEditingGame(null)}
                    game={editingGame}
                />
            )}
        </div>
    );
}
