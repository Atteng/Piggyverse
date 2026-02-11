import { Button } from "@/components/ui/button";
import { TopPlayersWidget } from "@/features/competitive-hub/top-players-widget";
import { TopAppsWidget } from "@/features/competitive-hub/top-apps-widget";
import { ActiveTournamentsWidget } from "@/features/tournaments/active-tournaments-widget";
import { GlobalLeaderboardTable } from "@/features/leaderboard/global-leaderboard-table";

export default function CompetitiveHubPage() {
    return (
        <div className="w-full max-w-7xl mx-auto space-y-8">
            {/* Header Section */}
            <div>
                <h1 className="text-4xl font-black text-white font-mono tracking-tighter mb-2">
                    Competitive Hub
                </h1>
                <p className="text-white font-mono text-sm max-w-md">
                    Compete in daily tournaments, climb the leaderboards, and earn rewards.
                </p>
            </div>

            <div className="space-y-8">
                {/* 3-Column Widgets Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 h-full items-stretch">
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
