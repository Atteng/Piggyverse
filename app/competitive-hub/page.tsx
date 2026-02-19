"use client";

import { useState } from "react";
import { TopPlayersWidget } from "@/features/competitive-hub/top-players-widget";
import { TopAppsWidget } from "@/features/competitive-hub/top-apps-widget";
import { ActiveTournamentsWidget } from "@/features/tournaments/active-tournaments-widget";
import { GlobalLeaderboardTable } from "@/features/leaderboard/global-leaderboard-table";
import { cn } from "@/lib/utils";
import { Trophy, Gamepad2, Users } from "lucide-react";

export default function CompetitiveHubPage() {
    const [activeTab, setActiveTab] = useState("players");

    const tabs = [
        { id: "players", label: "Players", icon: Users },
        { id: "apps", label: "Apps", icon: Gamepad2 },
        { id: "tournaments", label: "Tournaments", icon: Trophy },
    ];

    return (
        <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8 space-y-6 md:space-y-8 pb-20">
            {/* Header Section */}
            <div>
                <h1 className="text-piggy-hero font-black text-white font-mono tracking-tighter mb-2">
                    <span className="md:hidden">Contest Hub</span>
                    <span className="hidden md:inline">Competitive Hub</span>
                </h1>
                <p className="text-white font-mono text-piggy-label md:text-piggy-body max-w-md opacity-70">
                    Compete in daily tournaments, climb the leaderboards, and earn rewards.
                </p>
            </div>

            <div className="space-y-6 md:space-y-8">
                {/* Mobile Tab Switcher */}
                <div className="flex lg:hidden w-full bg-black/40 p-1 rounded-2xl border border-white/5 gap-1 shadow-inner">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-1 py-2.5 px-1.5 rounded-xl text-piggy-tiny font-bold transition-all whitespace-nowrap",
                                activeTab === tab.id
                                    ? "bg-[var(--color-piggy-deep-pink)] text-white shadow-lg"
                                    : "text-white/40 hover:text-white/60"
                            )}
                        >
                            <tab.icon className="w-3 h-3 shrink-0" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* 3-Column Widgets Row - Tabbed on mobile/tablet, Grid on lg */}
                <div className="lg:hidden">
                    {activeTab === "players" && <TopPlayersWidget />}
                    {activeTab === "apps" && <TopAppsWidget />}
                    {activeTab === "tournaments" && <ActiveTournamentsWidget />}
                </div>

                <div className="hidden lg:grid grid-cols-3 gap-6 h-full items-stretch">
                    <TopPlayersWidget />
                    <TopAppsWidget />
                    <ActiveTournamentsWidget />
                </div>

                {/* Global Leaderboard */}
                <GlobalLeaderboardTable />
            </div>
        </div>
    );
}
