
import { create } from 'zustand';

export interface Market {
    id: string;
    tournamentId: string;
    question: string;
    type: 'parimutuel' | 'weighted' | 'binary' | 'score';
    options: {
        id: string;
        label: string;
        odds?: number; // Estimated multiplier
        totalStaked: number;
    }[];
    totalPool: number;
    closesAt: string;
    status: 'open' | 'locked' | 'settled';
    result?: string; // ID of winning option
}

export interface UserBet {
    id: string;
    marketId: string;
    optionId: string;
    amount: number;
    tokenType: 'UP' | 'PIGGY';
    timestamp: string;
    status: 'pending' | 'won' | 'lost';
    potentialPayout: number;
}

interface BetState {
    activeMarkets: Market[];
    setActiveMarkets: (markets: Market[]) => void;

    userBets: UserBet[];
    setUserBets: (bets: UserBet[]) => void;
    addUserBet: (bet: UserBet) => void;

    selectedMarket: Market | null;
    selectMarket: (market: Market | null) => void;
}

export const useBetStore = create<BetState>()((set) => ({
    activeMarkets: [],
    setActiveMarkets: (markets) => set({ activeMarkets: markets }),

    userBets: [],
    setUserBets: (bets) => set({ userBets: bets }),
    addUserBet: (bet) => set((state) => ({ userBets: [bet, ...state.userBets] })),

    selectedMarket: null,
    selectMarket: (market) => set({ selectedMarket: market }),
}));
