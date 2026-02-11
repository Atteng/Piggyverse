
import { create } from 'zustand';

export interface LeaderboardEntry {
    rank: number;
    userId: string;
    username: string;
    avatarUrl: string;
    globalScore: number;
    stats: {
        effort: number;      // 50%
        proficiency: number; // 35%
        activity: number;    // 15%
        matchWins: number;
        tournamentWins: number;
        timePlayedHours: number;
    };
    trend: 'up' | 'down' | 'stable';
}

interface LeaderboardState {
    globalRankings: LeaderboardEntry[];
    setGlobalRankings: (rankings: LeaderboardEntry[]) => void;

    userRank: LeaderboardEntry | null;
    setUserRank: (entry: LeaderboardEntry | null) => void;

    timeframe: 'weekly' | 'monthly' | 'all-time';
    setTimeframe: (timeframe: 'weekly' | 'monthly' | 'all-time') => void;
}

export const useLeaderboardStore = create<LeaderboardState>()((set) => ({
    globalRankings: [],
    setGlobalRankings: (rankings) => set({ globalRankings: rankings }),

    userRank: null,
    setUserRank: (entry) => set({ userRank: entry }),

    timeframe: 'weekly',
    setTimeframe: (timeframe) => set({ timeframe }),
}));
