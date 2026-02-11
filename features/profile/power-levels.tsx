"use client";

import { Zap, Trophy, Clock, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

interface User {
    effortScore: number;
    proficiencyScore: number;
    activityScore: number;
}

export function PowerLevels() {
    const { data: session } = useSession();

    const { data: user, isLoading } = useQuery<User>({
        queryKey: ['user', 'me'],
        queryFn: async () => {
            const res = await fetch('/api/users/me');
            if (!res.ok) throw new Error('Failed to fetch user');
            return res.json();
        },
        enabled: !!session,
    });

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex items-center justify-center h-32">
                        <Loader2 className="w-6 h-6 text-white/50 animate-spin" />
                    </div>
                ))}
            </div>
        );
    }

    if (!user) return null;

    const powerLevels = [
        {
            name: "Effort",
            score: user.effortScore,
            max: 1000,
            percentage: (user.effortScore / 1000) * 100,
            weight: "50%",
            icon: Zap,
            color: "var(--color-piggy-deep-pink)"
        },
        {
            name: "Proficiency",
            score: user.proficiencyScore,
            max: 1000,
            percentage: (user.proficiencyScore / 1000) * 100,
            weight: "35%",
            icon: Trophy,
            color: "#A855F7" // purple
        },
        {
            name: "Activity",
            score: user.activityScore,
            max: 1000,
            percentage: (user.activityScore / 1000) * 100,
            weight: "15%",
            icon: Clock,
            color: "#3B82F6" // blue
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {powerLevels.map((level) => {
                const Icon = level.icon;
                return (
                    <div key={level.name} className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                                    <Icon className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-white">{level.name}</h3>
                                    <p className="text-xs text-white/50">Weight: {level.weight}</p>
                                </div>
                            </div>
                        </div>

                        {/* Score Display */}
                        <div className="mb-3">
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold text-white">{level.score}</span>
                                <span className="text-sm text-white/40">/ {level.max}</span>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
                            <div
                                className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                                style={{
                                    width: `${level.percentage}%`,
                                    background: level.color
                                }}
                            />
                        </div>

                        {/* Percentage */}
                        <p className="text-xs text-white/50 mt-2 text-right">{level.percentage.toFixed(1)}%</p>
                    </div>
                );
            })}
        </div>
    );
}
