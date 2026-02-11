"use client";

import { motion } from "framer-motion";
import { Play, Users, Trophy, Clock, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GameCardProps {
    game: {
        id: string;
        title: string;
        thumbnail: string;
        categories: string[];
        playerCount: string;
        tournamentStatus?: string | null;
        prizePool?: string | null;
        bettingAllowed?: boolean;
        gameUrl?: string | null;
    };
}

export function GameCard({ game }: GameCardProps) {
    return (
        <motion.div
            whileHover={{ y: -8, scale: 1.02 }}
            className="group relative bg-black/40 border border-white/10 rounded-3xl overflow-hidden hover:border-[var(--color-piggy-deep-pink)]/50 transition-all duration-300 shadow-lg hover:shadow-[var(--color-piggy-deep-pink)]/20 h-full flex flex-col"
        >
            {/* Image Container */}
            <div className="relative h-40 w-full overflow-hidden shrink-0">
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10" />
                <img
                    src={game.thumbnail}
                    alt={game.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />

                {/* Status Tags Stack - Compact Card, Normal Tags */}
                <div className="absolute top-3 right-3 z-20 flex flex-col items-end gap-1.5">
                    {/* Tournament Status */}
                    {game.tournamentStatus && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/20 bg-black/60 backdrop-blur-md shadow-lg text-white">
                            {game.tournamentStatus === "Ongoing" ? (
                                <>
                                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-piggy-super-green)] animate-pulse" />
                                    <span className="text-[10px] font-bold tracking-wider uppercase">Ongoing</span>
                                </>
                            ) : (
                                <>
                                    <Clock className="h-3 w-3" />
                                    <span className="text-[10px] font-bold tracking-wider uppercase">{game.tournamentStatus}</span>
                                </>
                            )}
                        </div>
                    )}

                    {/* Prize Pool */}
                    {game.prizePool && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/20 bg-black/60 backdrop-blur-md shadow-lg text-white">
                            <Trophy className="h-3 w-3" />
                            <span className="text-[10px] font-bold tracking-wider uppercase">
                                {game.prizePool}
                            </span>
                        </div>
                    )}

                    {/* Betting Allowed */}
                    {game.bettingAllowed && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/20 bg-black/60 backdrop-blur-md shadow-lg text-white">
                            <Coins className="h-3 w-3" />
                            <span className="text-[10px] font-bold tracking-wider uppercase">
                                Betting
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="p-3 relative z-20 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-1">
                    <div>
                        <h3 className="text-lg font-bold text-white font-mono leading-tight mb-1 group-hover:text-[var(--color-piggy-deep-pink)] transition-colors">
                            {game.title}
                        </h3>
                        <div className="flex flex-wrap gap-1.5">
                            {game.categories.map((cat) => (
                                <span key={cat} className="text-[9px] text-gray-400 font-medium tracking-wide uppercase bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                                    {cat}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-auto pt-3 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-gray-400">
                        <Users className="h-3 w-3" />
                        <span className="text-[10px] font-mono">{game.playerCount}</span>
                    </div>

                    <Button
                        onClick={async () => {
                            if (!game.gameUrl) return;

                            // Track play (fire and forget)
                            fetch(`/api/games/${game.id}/play`, { method: "POST" }).catch(console.error);

                            window.open(game.gameUrl, '_blank');
                        }}
                        disabled={!game.gameUrl}
                        className="h-7 px-3 rounded-full bg-white/10 hover:bg-[var(--color-piggy-deep-pink)] text-white text-[10px] font-bold transition-all hover:scale-105 active:scale-95 group/btn border border-white/5 hover:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Play className="h-2.5 w-2.5 mr-1 fill-current" />
                        Play
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}
