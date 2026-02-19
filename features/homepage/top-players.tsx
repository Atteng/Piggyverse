"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { getLeaderboard } from "@/lib/api/leaderboard";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ChevronRight, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";
import Link from "next/link";

const getRankSuffix = (rank: number) => {
    if (rank === 1) return "st";
    if (rank === 2) return "nd";
    if (rank === 3) return "rd";
    return "th";
};

export function TopPlayers() {
    const [hoveredPlayer, setHoveredPlayer] = useState<string | null>(null);
    const { data: leaderboard, isLoading } = useQuery({
        queryKey: ['leaderboard', 'home'],
        queryFn: () => getLeaderboard('all', 5),
    });

    const topPlayers = leaderboard || [];

    if (isLoading) {
        return (
            <div className="bg-black/60 backdrop-blur-3xl border border-white/10 rounded-3xl p-6 h-full flex flex-col justify-center items-center min-h-[200px]">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--color-piggy-deep-pink)]" />
            </div>
        );
    }

    return (
        <div className="bg-black/60 backdrop-blur-3xl border border-white/5 rounded-2xl md:rounded-[2.5rem] p-4 md:p-6 h-full flex flex-col shadow-2xl relative overflow-hidden">
            {/* Header */}
            <div className="flex flex-col mb-1 md:mb-6 z-10">
                <div className="flex items-center justify-between w-full">
                    <h2 className="text-piggy-title font-black text-white font-mono tracking-tighter leading-[0.8]">Top Players</h2>
                    <Link href="/competitive-hub" className="text-piggy-label font-bold text-white/60 hover:text-white transition-colors flex items-center gap-1 group/link whitespace-nowrap shrink-0">
                        View All <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-0.5" />
                    </Link>
                </div>
                <p className="text-piggy-body text-white/40 font-medium leading-tight mt-1">
                    The best of the best to grace the piggyverse
                </p>
            </div>

            {topPlayers.length > 0 ? (
                <div className="grid grid-cols-5 gap-4 overflow-y-auto pr-2 custom-scrollbar">
                    {topPlayers.slice(0, 10).map((player, index) => (
                        <div
                            key={player.username}
                            className="relative group cursor-pointer"
                            onMouseEnter={() => setHoveredPlayer(player.username)}
                            onMouseLeave={() => setHoveredPlayer(null)}
                        >
                            <div className="relative aspect-square rounded-2xl bg-black border border-white/10 overflow-hidden group-hover:border-[var(--color-piggy-deep-pink)] transition-all shadow-lg">
                                <Avatar className="w-full h-full rounded-none">
                                    <AvatarImage src={player.avatar || ""} className="object-cover" />
                                    <AvatarFallback className="bg-white/5 text-piggy-tiny font-bold text-white/40 rounded-none">
                                        {player.username?.[0] || "?"}
                                    </AvatarFallback>
                                </Avatar>

                                {/* Hover Score Overlay */}
                                {hoveredPlayer === player.username && (
                                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center animate-in fade-in zoom-in duration-200">
                                        <span className="text-piggy-tiny font-bold text-white tracking-widest uppercase">
                                            {player.effortScore}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-white/20 gap-4">
                    <Users className="w-12 h-12 opacity-20" />
                    <p className="font-mono text-piggy-body tracking-widest">No players yet</p>
                </div>
            )}
        </div>
    );
}
