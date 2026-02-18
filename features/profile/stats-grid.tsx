"use client";

import { Trophy, Users, Clock, Flame, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

interface UserStats {
    // Scores
    globalRank: number;
    effortScore: number;
    proficiencyScore: number;
    activityScore: number;

    // Stats
    tournamentsHosted: number;
    tournamentsWon: number;
    matchWins: number;
    totalHoursPlayed: number;
    totalHoursWatched: number;
    currentStreak: number;
    prizePoolsSeeded: number;
}

export function StatsGrid() {
    const { data: session } = useSession();

    const { data: userStats, isLoading } = useQuery<UserStats>({
        queryKey: ['user', 'me', 'stats'],
        queryFn: async () => {
            const res = await fetch('/api/users/me/stats');
            if (!res.ok) throw new Error('Failed to fetch stats');
            return res.json();
        },
        enabled: !!session,
    });

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={`score-${i}`} className="bg-black/60 backdrop-blur-3xl border border-white/10 rounded-2xl p-6 h-24 animate-pulse" />
                    ))}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={`stat-${i}`} className="bg-black/60 backdrop-blur-3xl border border-white/10 rounded-2xl p-6 h-32 animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (!userStats) return null;

    const scores = [
        {
            label: "Effort Score (50%)",
            value: userStats.effortScore || 0,
            icon: Users,
            color: "#F472B6", // Pink 400
            desc: "Hosting & Seeding"
        },
        {
            label: "Proficiency Score (35%)",
            value: userStats.proficiencyScore || 0,
            icon: Trophy,
            color: "#A855F7", // Purple 500
            desc: "Wins & Placements"
        },
        {
            label: "Activity Score (15%)",
            value: userStats.activityScore || 0,
            icon: Clock,
            color: "#3B82F6", // Blue 500
            desc: "Playing & Watching"
        }
    ];

    const stats = [
        {
            label: "Tournaments Hosted",
            value: userStats.tournamentsHosted || 0,
            icon: Trophy,
            color: "var(--color-piggy-deep-pink)"
        },
        {
            label: "Tournament Wins",
            value: userStats.tournamentsWon || 0,
            icon: Trophy,
            color: "#F59E0B"
        },
        {
            label: "Total Match Wins",
            value: userStats.matchWins || 0,
            icon: Flame,
            color: "#EF4444"
        },
        {
            label: "Hours Played",
            value: Math.floor((userStats.totalHoursPlayed || 0)),
            icon: Clock,
            color: "#3B82F6"
        },
        {
            label: "Hours Watched",
            value: userStats.totalHoursWatched?.toFixed(1) || "0.0",
            icon: Users,
            color: "#10B981"
        },
        {
            label: "Seeded Amount",
            value: `$${userStats.prizePoolsSeeded?.toLocaleString() || '0'}`,
            icon: Users,
            color: "#F472B6"
        }
    ];

    return (
        <div className="space-y-8">
            {/* Scores Section */}
            <div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {scores.map((score) => {
                        const Icon = score.icon;
                        return (
                            <div key={score.label} className="bg-black/60 backdrop-blur-3xl border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-white/20 transition-colors">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Icon className="w-5 h-5 text-white" />
                                        <p className="text-sm text-white/60">{score.label}</p>
                                    </div>
                                    <p className="text-3xl font-black text-white mb-1">{score.value}</p>
                                    <p className="text-xs text-white/40">{score.desc}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Detailed Stats Section */}
            <div>
                <h3 className="text-xl font-bold text-white mb-4">Activity Stats</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {stats.map((stat) => {
                        const Icon = stat.icon;
                        return (
                            <div key={stat.label} className="bg-black/60 backdrop-blur-3xl border border-white/10 rounded-2xl p-4 flex flex-col items-center text-center">
                                <div className="p-2 rounded-lg bg-white/5 border border-white/10 mb-2">
                                    <Icon className="w-4 h-4 text-white" />
                                </div>
                                <p className="text-lg font-bold text-white mb-1">{stat.value}</p>
                                <p className="text-[10px] text-white/50 uppercase tracking-wider">{stat.label}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
