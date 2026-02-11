"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { getLeaderboard } from "@/lib/api/leaderboard";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

const getRankSuffix = (rank: number) => {
    if (rank === 1) return "st";
    if (rank === 2) return "nd";
    if (rank === 3) return "rd";
    return "th";
};

export function TopPlayers() {
    const { data: leaderboard, isLoading } = useQuery({
        queryKey: ['leaderboard', 'home'],
        queryFn: () => getLeaderboard('all', 5),
    });

    const topPlayers = leaderboard || [];

    if (isLoading) {
        return (
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 h-full flex flex-col justify-center items-center min-h-[200px]">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--color-piggy-deep-pink)]" />
            </div>
        );
    }

    return (
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 h-full flex flex-col justify-center relative overflow-hidden group min-h-[200px]">
            {/* Ambient Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-piggy-deep-pink)]/10 rounded-full blur-[100px] -z-10 group-hover:bg-[var(--color-piggy-deep-pink)]/20 transition-all duration-700" />

            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-white font-mono tracking-tight">Top Players</h3>
                <span className="text-[10px] font-bold text-[var(--color-piggy-deep-pink)] bg-[var(--color-piggy-deep-pink)]/10 px-2.5 py-1 rounded-full border border-[var(--color-piggy-deep-pink)]/20">
                    ALL TIME
                </span>
            </div>

            <div className="flex items-end justify-between gap-2 px-2">
                {topPlayers.length > 0 ? (
                    topPlayers.slice(0, 5).map((player, index) => {
                        const rank = index + 1;
                        const getMedalColor = () => {
                            if (rank === 1) return { bg: "bg-gradient-to-r from-yellow-400 to-orange-500", text: "text-black", border: "border-yellow-200", shadow: "shadow-[0_0_20px_rgba(234,179,8,0.3)]" };
                            if (rank === 2) return { bg: "bg-gradient-to-r from-gray-300 to-gray-400", text: "text-black", border: "border-gray-300", shadow: "shadow-[0_0_20px_rgba(192,192,192,0.3)]" };
                            if (rank === 3) return { bg: "bg-gradient-to-r from-amber-600 to-amber-700", text: "text-white", border: "border-amber-500", shadow: "shadow-[0_0_20px_rgba(217,119,6,0.3)]" };
                            return { bg: "bg-black/80", text: "text-white", border: "border-white/20", shadow: "" };
                        };
                        const medalStyle = getMedalColor();

                        return (
                            <motion.div
                                key={player.username}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex flex-col items-center gap-3 group/player relative"
                            >
                                {/* Rank Badge */}
                                <div className={cn(
                                    "absolute -top-4 z-20 font-black text-sm px-2 py-0.5 rounded-full border shadow-lg transform transition-transform group-hover/player:-translate-y-1",
                                    medalStyle.bg,
                                    medalStyle.text,
                                    medalStyle.border
                                )}>
                                    #{rank}
                                </div>

                                {/* Avatar Container - All Same Size */}
                                <div className={cn(
                                    "relative rounded-2xl overflow-hidden border-2 transition-all duration-300 group-hover/player:shadow-[0_0_20px_rgba(255,47,122,0.4)] group-hover/player:scale-105",
                                    "w-20 h-20",
                                    rank <= 3 ? `${medalStyle.border} ${medalStyle.shadow}` : "border-white/10 group-hover/player:border-[var(--color-piggy-deep-pink)]"
                                )}>
                                    <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900" />
                                    {/* Image Fallback */}
                                    <img src={player.avatar} alt={player.username} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover/player:opacity-100 transition-opacity" />
                                </div>

                                {/* Username */}
                                <span className={cn(
                                    "font-mono font-bold tracking-wide transition-colors text-xs",
                                    rank === 1 ? "text-yellow-400" : rank === 2 ? "text-gray-300" : rank === 3 ? "text-amber-600/80" : "text-gray-400 group-hover/player:text-white"
                                )}>
                                    {player.username}
                                </span>
                            </motion.div>
                        );
                    })
                ) : (
                    <div className="w-full text-center text-gray-500 font-mono text-sm py-8">
                        No ranked players yet.
                    </div>
                )}
            </div>
        </div>
    );
}
