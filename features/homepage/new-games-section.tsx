"use client";

import { useQuery } from "@tanstack/react-query";
import { getGames } from "@/lib/api/games";
import { GameCard } from "@/features/library/game-card";
import { Button } from "@/components/ui/button";
import { Play, Loader2, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export function NewGamesSection() {
    const { data, isLoading } = useQuery({
        queryKey: ['games', 'new-arrivals'],
        queryFn: () => getGames({ sort: 'newest', limit: 8 }),
    });

    const games = data?.games || [];

    if (isLoading) {
        return (
            <div className="w-full flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--color-piggy-deep-pink)]" />
            </div>
        );
    }

    if (games.length === 0) return null;

    return (
        <div className="h-full flex flex-col relative overflow-hidden">
            <div className="flex flex-col mb-1 md:mb-6 z-10 px-2 text-white">
                <h2 className="text-piggy-title font-black font-mono tracking-tight mb-0 md:mb-1 leading-[0.8]">New Arrivals</h2>
                <p className="text-piggy-body text-white/40 font-medium tracking-tight ml-1 leading-tight">
                    Latest additions to the piggyverse
                </p>
            </div>

            <div className="flex flex-col gap-2.5 overflow-y-auto pr-2 custom-scrollbar flex-1">
                {games.map((game, index) => (
                    <motion.div
                        key={game.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="group relative flex items-center h-[88px] bg-black/60 hover:bg-white rounded-[1.25rem] border border-white/5 hover:border-black/10 transition-all duration-300 hover:scale-[1.01] shadow-xl backdrop-blur-3xl overflow-hidden"
                    >
                        {/* Thumbnail - 1:1 Square */}
                        <div className="h-full w-[88px] p-2 shrink-0">
                            <div className="w-full h-full rounded-xl overflow-hidden border border-white/10">
                                <img src={game.thumbnail} alt={game.title} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
                            </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 px-3 flex flex-col min-w-0">
                            <h3 className="text-piggy-title font-black text-white group-hover:text-black font-mono tracking-tighter transition-colors truncate leading-[0.7] mb-0">
                                {game.title}
                            </h3>
                            <div className="flex items-center gap-2 -mt-1">
                                <span className="text-piggy-label font-black text-[var(--color-piggy-deep-pink)] group-hover:text-black transition-colors uppercase tracking-widest">
                                    {game.categories[0] || "Puzzle"}
                                </span>
                                <span className="text-white/20 group-hover:text-black/20">•</span>
                                <span className="text-piggy-label font-black text-white/40 group-hover:text-black/40 transition-colors uppercase tracking-widest truncate max-w-[100px]">
                                    {game.uploaderName || "Admin"}
                                </span>
                            </div>
                        </div>

                        {/* Action */}
                        <div className="px-4">
                            <Button
                                onClick={async () => {
                                    if (!game.gameUrl) return;
                                    fetch(`/api/games/${game.id}/play`, { method: "POST" }).catch(console.error);
                                    window.open(game.gameUrl, '_blank');
                                }}
                                disabled={!game.gameUrl}
                                className="bg-[#ff2f7a] hover:bg-[#ff2f7a]/90 text-white rounded-full w-8 h-8 shadow-lg transition-all hover:scale-110 active:scale-95 flex items-center justify-center p-0 shrink-0"
                            >
                                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                            </Button>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-b from-[var(--color-piggy-deep-pink)]/5 to-transparent blur-3xl -z-10" />
        </div>
    );
}
