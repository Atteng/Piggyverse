"use client";

import { useState } from "react";
import { getLeaderboard } from "@/lib/api/leaderboard";
import { useQuery } from "@tanstack/react-query";
import { getGames } from "@/lib/api/games";
import { Loader2, TrendingUp, Trophy, Filter } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export function GlobalLeaderboardTable() {
    const [selectedGame, setSelectedGame] = useState<string>("all");

    // Fetch games for the filter dropdown
    const { data: gamesData } = useQuery({
        queryKey: ['games', 'filter'],
        queryFn: () => getGames({ limit: 100, sort: 'popular' }),
    });

    const games = gamesData?.games || [];

    const { data: leaderboard, isLoading, isError } = useQuery({
        queryKey: ['leaderboard', selectedGame],
        queryFn: () => getLeaderboard(selectedGame),
    });

    const entries = leaderboard || [];

    if (isLoading) {
        return (
            <div className="bg-black/60 backdrop-blur-3xl border border-white/10 rounded-3xl p-6 h-[400px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--color-piggy-deep-pink)]" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="bg-black/60 backdrop-blur-3xl border border-white/10 rounded-3xl p-6 h-[400px] flex items-center justify-center text-red-400">
                Failed to load leaderboard.
            </div>
        );
    }

    return (
        <div className="bg-black/60 backdrop-blur-3xl border border-white/5 rounded-2xl md:rounded-[2.5rem] p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <h3 className="text-piggy-title font-bold text-white font-mono tracking-tighter leading-[0.8]">Global Leaderboard</h3>
                    <div className="flex items-center gap-2 text-piggy-label font-black text-[var(--color-piggy-deep-pink)] bg-[var(--color-piggy-deep-pink)]/10 px-3 py-1.5 rounded-full border border-[var(--color-piggy-deep-pink)]/20 uppercase tracking-tight">
                        <TrendingUp className="w-3 h-3" />
                        All time
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Select value={selectedGame} onValueChange={setSelectedGame}>
                        <SelectTrigger className="w-full md:w-[180px] h-9 border-white/10 bg-black/20 text-piggy-body font-mono focus:ring-1 focus:ring-white/20 transition-all">
                            <Filter className="w-3 h-3 mr-2 text-gray-400" />
                            <SelectValue placeholder="Select App" />
                        </SelectTrigger>
                        <SelectContent align="end">
                            <SelectItem value="all">All Apps</SelectItem>
                            {games.map(game => (
                                <SelectItem key={game.id} value={game.id}>{game.title}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="overflow-x-auto lg:overflow-visible">
                <table className="w-full">
                    <thead className="hidden lg:table-header-group">
                        <tr className="border-b border-white/10">
                            <th className="text-left py-3 px-4 text-piggy-label font-bold text-gray-500 capitalize tracking-tight font-mono">Rank</th>
                            <th className="text-left py-3 px-4 text-piggy-label font-bold text-gray-500 capitalize tracking-tight font-mono">Player</th>
                            <th className="text-center py-3 px-2 text-piggy-label font-bold text-gray-500 capitalize tracking-tight font-mono">Match Wins</th>
                            <th className="text-center py-3 px-2 text-piggy-label font-bold text-gray-500 capitalize tracking-tight font-mono">Time Played</th>
                            <th className="text-center py-3 px-2 text-piggy-label font-bold text-gray-500 capitalize tracking-tight font-mono">Tournament Wins</th>
                            <th className="text-center py-3 px-2 text-piggy-label font-bold text-gray-500 capitalize tracking-tight font-mono">Best</th>
                            <th className="text-right py-3 px-4 text-piggy-label font-bold text-gray-500 capitalize tracking-tight font-mono">Effort Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        {entries.length > 0 ? (
                            entries.map((player, index) => (
                                <tr
                                    key={index}
                                    className="border-b border-white/5 hover:bg-white/5 transition-colors group"
                                >
                                    <td className="py-3 lg:py-4 px-2 lg:px-4">
                                        <div className="flex items-center gap-2">
                                            {index < 3 ? (
                                                <div className={`w-5 h-5 lg:w-6 lg:h-6 rounded-full flex items-center justify-center text-piggy-label font-bold text-black ${index === 0 ? 'bg-[#FFD700]' :
                                                    index === 1 ? 'bg-[#C0C0C0]' : 'bg-[#CD7F32]'
                                                    }`}>
                                                    {player.rank}
                                                </div>
                                            ) : (
                                                <span className="text-piggy-label font-mono text-gray-500 w-5 lg:w-6 text-center">{player.rank}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-3 lg:py-4 px-2 lg:px-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full overflow-hidden border border-white/10 flex-shrink-0">
                                                <img src={player.avatar} alt={player.username} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-mono text-piggy-body font-bold text-white group-hover:text-[var(--color-piggy-deep-pink)] transition-colors truncate">
                                                    {player.username}
                                                </span>
                                                {/* Mobile-only stats row */}
                                                <div className="flex lg:hidden items-center gap-1.5 whitespace-nowrap overflow-hidden mt-0.5">
                                                    <span className="text-piggy-tiny font-bold text-white/40 uppercase tracking-tighter">
                                                        {player.matchWins} WINS
                                                    </span>
                                                    <span className="text-white/10 text-piggy-tiny">•</span>
                                                    <span className="text-piggy-tiny font-medium text-white/20 uppercase">
                                                        {player.timePlayed}
                                                    </span>
                                                    <span className="text-white/10 text-piggy-tiny lg:hidden">•</span>
                                                    <div className="flex items-center gap-0.5">
                                                        <Trophy className="w-2.5 h-2.5 text-[var(--color-piggy-deep-pink)]" />
                                                        <span className="text-piggy-tiny font-bold text-[var(--color-piggy-deep-pink)]">{player.tourneyWins}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="text-center py-4 px-2 hidden lg:table-cell">
                                        <span className="font-mono text-piggy-body text-gray-300">{player.matchWins}</span>
                                    </td>
                                    <td className="text-center py-4 px-2 hidden lg:table-cell">
                                        <span className="font-mono text-piggy-label text-gray-400">{player.timePlayed}</span>
                                    </td>
                                    <td className="text-center py-4 px-2 hidden lg:table-cell">
                                        <div className="flex items-center justify-center gap-1">
                                            <Trophy className="w-3 h-3 text-[var(--color-piggy-deep-pink)]" />
                                            <span className="font-mono text-piggy-body text-gray-300">{player.tourneyWins}</span>
                                        </div>
                                    </td>
                                    <td className="text-center py-4 px-2 hidden lg:table-cell">
                                        <span className="font-mono text-piggy-label text-gray-400">{player.bestTime}</span>
                                    </td>
                                    <td className="text-right py-3 lg:py-4 px-2 lg:px-4">
                                        <span className="font-mono text-piggy-body font-bold text-[var(--color-piggy-super-green)]">
                                            {player.effortScore.toLocaleString()}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} className="py-12 text-center text-gray-500 font-mono">
                                    No leaderboard data available yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

