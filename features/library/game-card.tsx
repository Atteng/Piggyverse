"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Play, Users, Trophy, Clock, Coins, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { GameEditModal } from "./game-edit-modal";
import { GameFrontend } from "@/lib/api/games";

interface GameCardProps {
    game: GameFrontend;
}

export function GameCard({ game }: GameCardProps) {
    const { data: session } = useSession();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Check if current user is the creator
    const isOwner = session?.user?.id === game.createdById;

    // DEBUG: To help user identify why it's not showing
    const debugInfo = false; // Set to true if you want to see IDs on cards

    return (
        <>
            {debugInfo && (
                <div className="text-[8px] font-mono text-gray-500 absolute -top-4 left-0 bg-black/80 p-1 z-50 rounded">
                    S: {session?.user?.id?.slice(-4)} | G: {game.createdById?.slice(-4)}
                </div>
            )}
            <motion.div
                whileHover={{ y: -4, scale: 1.01 }}
                className="group relative bg-black/60 backdrop-blur-3xl border border-white/5 rounded-[1.5rem] overflow-hidden hover:bg-white hover:border-black/10 transition-all duration-300 shadow-2xl flex flex-col md:flex-row h-auto md:h-[200px]"
            >
                {/* Image Section - 1:1 on Desktop, Aspect-Video on Mobile */}
                <div className="relative w-full md:w-[200px] aspect-video md:aspect-square overflow-hidden shrink-0 p-3">
                    <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                        <img
                            src={game.thumbnail}
                            alt={game.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        {/* Status Badges Overlay */}
                        <div className="absolute top-2 left-2 flex flex-col gap-1 z-20">
                            {game.tournamentStatus && (
                                <div className="px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/10 text-[7px] font-black text-white uppercase tracking-widest shadow-xl flex items-center gap-1.5">
                                    <div className="w-1 h-1 rounded-full bg-[var(--color-piggy-deep-pink)] animate-pulse" />
                                    Tournament
                                </div>
                            )}
                            {game.bettingAllowed && (
                                <div className="px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/10 text-[7px] font-black text-white uppercase tracking-widest shadow-xl flex items-center gap-1.5">
                                    <div className="w-1 h-1 rounded-full bg-gray-400" />
                                    Betting
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div className="flex-1 p-5 md:pl-2 flex flex-col justify-between relative overflow-hidden">
                    <div className="min-w-0">
                        {/* Category & Uploader Info */}
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[9px] font-black text-[var(--color-piggy-deep-pink)] group-hover:text-black transition-colors uppercase tracking-widest truncate">
                                {game.categories[0] || "Puzzle"}
                            </span>
                            <span className="text-white/20 group-hover:text-black/20">•</span>
                            <span className="text-[9px] font-black text-white/40 group-hover:text-black/40 transition-colors uppercase tracking-widest truncate">
                                {game.uploaderName || "Monster 18"}
                            </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-lg font-black text-white group-hover:text-black font-mono leading-none mb-2 tracking-tighter uppercase transition-colors truncate">
                            {game.title}
                        </h3>

                        {/* Description */}
                        <p className="text-[12px] font-normal text-white/70 group-hover:text-black/70 transition-colors leading-snug line-clamp-4">
                            {game.description || "Built to be played by friends, enemies or even strangers needing a good time. Supports both single and multiplayer modes"}
                        </p>
                    </div>

                    {/* Bottom Actions */}
                    <div className="flex items-center justify-end gap-3 pb-1">
                        {isOwner && (
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsEditModalOpen(true);
                                }}
                                className="h-9 w-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-white/40 hover:text-white transition-all shadow-xl"
                            >
                                <Settings className="h-4 w-4" />
                            </Button>
                        )}
                        <Button
                            onClick={async () => {
                                if (!game.gameUrl) return;
                                fetch(`/api/games/${game.id}/play`, { method: "POST" }).catch(console.error);
                                window.open(game.gameUrl, '_blank');
                            }}
                            disabled={!game.gameUrl}
                            className="bg-[var(--color-piggy-deep-pink)] hover:bg-[var(--color-piggy-deep-pink)]/90 text-white rounded-full font-black px-6 h-9 text-xs shadow-[0_0_20px_rgba(255,47,122,0.3)] transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                        >
                            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            Play
                        </Button>
                    </div>
                </div>
            </motion.div>

            <GameEditModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                game={game}
            />
        </>
    );
}
