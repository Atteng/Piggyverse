"use client";

import { useState } from "react";
import { getLeaderboard } from "@/lib/api/leaderboard";
import { useQuery } from "@tanstack/react-query";
import { GAMES } from "@/lib/data/mock";
import { Trophy, TrendingUp, Filter, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function GlobalLeaderboardTable() {
    const [selectedGame, setSelectedGame] = useState<string>("all");

    const { data: leaderboard, isLoading, isError } = useQuery({
        queryKey: ['leaderboard', selectedGame],
        queryFn: () => getLeaderboard(selectedGame),
    });

    const entries = leaderboard || [];

    if (isLoading) {
        return (
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 h-[400px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--color-piggy-deep-pink)]" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 h-[400px] flex items-center justify-center text-red-400">
                Failed to load leaderboard.
            </div>
        );
    }

    return (
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-white font-mono">Global Leaderboard</h3>
                    <div className="flex items-center gap-2 text-xs font-bold text-[var(--color-piggy-deep-pink)] bg-[var(--color-piggy-deep-pink)]/10 px-3 py-1.5 rounded-full border border-[var(--color-piggy-deep-pink)]/20">
                        <TrendingUp className="w-3 h-3" />
                        ALL TIME
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Select value={selectedGame} onValueChange={setSelectedGame}>
                        <SelectTrigger className="w-[180px] h-9 border-white/10 bg-black/20 text-xs font-mono">
                            <Filter className="w-3 h-3 mr-2 text-gray-400" />
                            <SelectValue placeholder="Select App" />
                        </SelectTrigger>
                        <SelectContent align="end">
                            <SelectItem value="all">All Apps</SelectItem>
                            {GAMES.map(game => (
                                <SelectItem key={game.id} value={game.id}>{game.title}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-white/10">
                            <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider font-mono">Rank</th>
                            <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider font-mono">Player</th>
                            <th className="text-center py-3 px-2 text-xs font-bold text-gray-500 uppercase tracking-wider font-mono">Match Wins</th>
                            <th className="text-center py-3 px-2 text-xs font-bold text-gray-500 uppercase tracking-wider font-mono hidden md:table-cell">Time Played</th>
                            <th className="text-center py-3 px-2 text-xs font-bold text-gray-500 uppercase tracking-wider font-mono hidden lg:table-cell">Tournament Wins</th>
                            <th className="text-center py-3 px-2 text-xs font-bold text-gray-500 uppercase tracking-wider font-mono hidden lg:table-cell">Best</th>
                            <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider font-mono">Effort Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        {entries.length > 0 ? (
                            entries.map((player, index) => (
                                <tr
                                    key={index}
                                    className="border-b border-white/5 hover:bg-white/5 transition-colors group"
                                >
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-2">
                                            {index < 3 ? (
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-black ${index === 0 ? 'bg-[#FFD700]' :
                                                    index === 1 ? 'bg-[#C0C0C0]' : 'bg-[#CD7F32]'
                                                    }`}>
                                                    {player.rank}
                                                </div>
                                            ) : (
                                                <span className="text-sm font-mono text-gray-500 w-6 text-center">{player.rank}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 flex-shrink-0">
                                                <img src={player.avatar} alt={player.username} className="w-full h-full object-cover" />
                                            </div>
                                            <span className="font-mono text-sm font-bold text-white group-hover:text-[var(--color-piggy-deep-pink)] transition-colors truncate">
                                                {player.username}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="text-center py-3 px-2">
                                        <span className="font-mono text-sm text-gray-300">{player.matchWins}</span>
                                    </td>
                                    <td className="text-center py-3 px-2 hidden md:table-cell">
                                        <span className="font-mono text-xs text-gray-400">{player.timePlayed}</span>
                                    </td>
                                    <td className="text-center py-3 px-2 hidden lg:table-cell">
                                        <div className="flex items-center justify-center gap-1">
                                            <Trophy className="w-3 h-3 text-[var(--color-piggy-deep-pink)]" />
                                            <span className="font-mono text-sm text-gray-300">{player.tourneyWins}</span>
                                        </div>
                                    </td>
                                    <td className="text-center py-3 px-2 hidden lg:table-cell">
                                        <span className="font-mono text-xs text-gray-400">{player.bestTime}</span>
                                    </td>
                                    <td className="text-right py-3 px-4">
                                        <span className="font-mono text-sm font-bold text-[var(--color-piggy-super-green)]">
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

