
"use client";

import { AnimatedCard } from "@/shared/ui/animated-card";
import { TrendingUp, Users, Trophy, Coins } from "lucide-react";

import { useQuery } from "@tanstack/react-query";

export function StatsCards() {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['globalStats'],
        queryFn: async () => {
            const res = await fetch('/api/stats/global');
            if (!res.ok) throw new Error('Failed to fetch stats');
            return res.json();
        },
        staleTime: 60000, // 1 minute
    });

    const displayStats = [
        {
            label: "Total Volume",
            value: stats ? `$${(stats.totalVolume || 0).toLocaleString()}` : "$0",
            change: "+12%",
            icon: Coins,
            color: "text-[var(--color-piggy-super-green)]"
        },
        {
            label: "Total Users",
            value: stats ? (stats.users || 0).toLocaleString() : "0",
            change: "+5%",
            icon: Users,
            color: "text-blue-400"
        },
        {
            label: "Tournaments",
            value: stats ? (stats.tournaments || 0).toLocaleString() : "0",
            change: "+8%",
            icon: Trophy,
            color: "text-[var(--color-piggy-deep-pink)]"
        },
        {
            label: "Total Bets",
            value: stats ? (stats.totalBets || 0).toLocaleString() : "0",
            change: "+18%",
            icon: TrendingUp,
            color: "text-purple-400"
        },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-7xl mx-auto px-6 -mt-10 relative z-10">
            {displayStats.map((stat, index) => (
                <AnimatedCard key={stat.label} delay={index * 0.1}>
                    <div className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-piggy-label text-gray-400 uppercase tracking-tight font-medium">{stat.label}</p>
                            <h3 className="text-piggy-title font-bold text-white mt-1 font-mono">
                                {isLoading ? "..." : stat.value}
                            </h3>
                            <p className="text-piggy-label text-[var(--color-piggy-super-green)] mt-1">{stat.change} this week</p>
                        </div>
                        <div className={`p-3 rounded-full bg-white/5 ${stat.color}`}>
                            <stat.icon className="h-6 w-6" />
                        </div>
                    </div>
                </AnimatedCard>
            ))}
        </div>
    );
}
