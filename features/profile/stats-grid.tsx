"use client";

import { Trophy, Users, Clock, Flame, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

interface UserStats {
    totalTournamentsHosted: number;
    totalWins: number;
    totalPlaytimeMinutes: number;
    currentStreak: number;
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex items-center justify-center h-32">
                        <Loader2 className="w-6 h-6 text-white/50 animate-spin" />
                    </div>
                ))}
            </div>
        );
    }

    if (!userStats) return null;

    const stats = [
        {
            label: "Tournaments Hosted",
            value: userStats.totalTournamentsHosted || 0,
            icon: Trophy,
            color: "var(--color-piggy-deep-pink)"
        },
        {
            label: "Total Wins",
            value: userStats.totalWins || 0,
            icon: Users,
            color: "#A855F7"
        },
        {
            label: "Hours Played",
            value: Math.floor((userStats.totalPlaytimeMinutes || 0) / 60),
            icon: Clock,
            color: "#3B82F6"
        },
        {
            label: "Current Streak",
            value: `${userStats.currentStreak || 0} days`,
            icon: Flame,
            color: "#F59E0B"
        }
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                    <div key={stat.label} className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                        <div className="flex flex-col items-center text-center">
                            <div className="p-3 rounded-lg bg-white/5 border border-white/10 mb-3">
                                <Icon className="w-6 h-6 text-white" />
                            </div>
                            <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
                            <p className="text-xs text-white/50 uppercase tracking-wider">{stat.label}</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
