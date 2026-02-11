export interface LeaderboardEntryFrontend {
    rank: number;
    username: string;
    avatar: string;
    matchWins: number;
    timePlayed: string;
    tourneyWins: number;
    bestTime: string;
    effortScore: number;
}

interface APILeaderboardEntry {
    rank: number;
    matchWins: number;
    timePlayedHours: number;
    tournamentsWon: number;
    user: {
        id: string;
        username: string;
        avatarUrl: string | null;
        effortScore: number;
    };
    game: {
        id: string;
        title: string;
    } | null;
}

export async function getLeaderboard(gameId: string | "all" = "all", limit = 10) {
    const params = new URLSearchParams({
        limit: limit.toString(),
    });

    if (gameId !== "all") {
        params.append("gameId", gameId);
    }

    const response = await fetch(`/api/leaderboard?${params.toString()}`);

    if (!response.ok) {
        throw new Error("Failed to fetch leaderboard");
    }

    const data: APILeaderboardEntry[] = await response.json();

    const entries: LeaderboardEntryFrontend[] = data.map((entry) => ({
        rank: entry.rank,
        username: entry.user.username,
        avatar: entry.user.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80",
        matchWins: entry.matchWins,
        timePlayed: `${entry.timePlayedHours}h`,
        tourneyWins: entry.tournamentsWon,
        bestTime: "--", // Not yet tracked in backend
        effortScore: entry.user.effortScore,
    }));

    return entries;
}
