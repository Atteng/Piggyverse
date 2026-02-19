"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getUserProfile } from "@/lib/api/users";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function YourStats() {
    const { data: userProfile, isLoading } = useQuery({
        queryKey: ['user', 'me'],
        queryFn: getUserProfile,
        retry: false,
    });

    const statsData = userProfile?.stats || {
        totalHoursPlayed: 0,
        tournamentsWon: 0,
        tokensEarned: 0,
    };

    const statsList = [
        {
            id: "win_rate",
            label: "Win Rate",
            subLabel: "WIN RATE",
            value: "0%",
            description: "your current success rate in tournaments across the piggyverse",
        },
        {
            id: "hours",
            label: "Hours Played",
            subLabel: "HOURS",
            value: statsData.totalHoursPlayed,
            description: "so far you've dedicated the following hours to conquering the piggyverse",
        },
        {
            id: "wins",
            label: "Game Wins",
            subLabel: "GAME WIN",
            value: statsData.tournamentsWon,
            description: "the number of times you've emerged victorious in piggyverse battles",
        },
        {
            id: "tokens",
            label: "Tokens Won",
            subLabel: "TOKENS WON",
            value: statsData.tokensEarned,
            description: "total tokens you've harvested through your skill and dedication",
        }
    ];

    const [expandedStat, setExpandedStat] = useState<string | null>(statsList[0].id);

    if (isLoading) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--color-piggy-deep-pink)]" />
            </div>
        );
    }

    return (
        <div className="flex items-center gap-3 w-full h-full">
            {statsList.map((stat) => {
                const isExpanded = expandedStat === stat.id;

                return (
                    <motion.div
                        key={stat.id}
                        layout
                        transition={{
                            layout: { type: "spring", stiffness: 300, damping: 30 },
                            opacity: { duration: 0.2 }
                        }}
                        initial={false}
                        onHoverStart={() => setExpandedStat(stat.id)}
                        onHoverEnd={() => setExpandedStat(null)}
                        onClick={() => setExpandedStat(isExpanded ? null : stat.id)}
                        className={cn(
                            "relative h-full rounded-[2rem] bg-black/60 backdrop-blur-3xl border border-white/5 p-4 flex flex-col cursor-pointer overflow-hidden",
                            isExpanded ? "flex-[2.5]" : "flex-[0.5] md:flex-1"
                        )}
                    >
                        <motion.div
                            layout
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className={cn(
                                "w-full py-2 px-3 rounded-full bg-[var(--color-piggy-deep-pink)] flex items-center justify-center mb-3 md:mb-6 shrink-0",
                                !isExpanded && "hidden md:flex"
                            )}
                        >
                            <span className="text-piggy-tiny font-black text-white uppercase tracking-tight whitespace-nowrap">
                                {stat.label}
                            </span>
                        </motion.div>

                        <div className={cn(
                            "flex-1 flex items-center justify-center gap-2 md:gap-4 px-1 min-h-0",
                            !isExpanded ? "hidden md:flex" : "flex-col-reverse md:flex-row"
                        )}>
                            <AnimatePresence mode="wait">
                                {isExpanded && (
                                    <motion.p
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        transition={{
                                            type: "spring",
                                            stiffness: 300,
                                            damping: 30,
                                            opacity: { duration: 0.15 }
                                        }}
                                        className="text-piggy-tiny font-medium text-white/40 leading-relaxed flex-1 text-center md:text-left"
                                    >
                                        {stat.description}
                                    </motion.p>
                                )}
                            </AnimatePresence>

                            <motion.div
                                layout
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className="flex flex-col items-center justify-center shrink-0"
                            >
                                <span className="text-piggy-title font-black text-white font-mono tracking-tighter leading-tight">
                                    {stat.value}
                                </span>
                                <span className="text-piggy-tiny font-black text-white/40 uppercase tracking-[0.2em] mt-2 text-center whitespace-nowrap">
                                    {stat.subLabel}
                                </span>
                            </motion.div>
                        </div>

                        {/* Vertical Label for Inactive Mobile State */}
                        {!isExpanded && (
                            <div className="absolute inset-0 flex items-center justify-center md:hidden pointer-events-none">
                                <span className="text-piggy-tiny font-black text-white uppercase tracking-[0.2em] [writing-mode:vertical-lr] rotate-180 whitespace-nowrap opacity-100">
                                    {stat.label}
                                </span>
                            </div>
                        )}
                    </motion.div>
                );
            })}
        </div>
    );
}
