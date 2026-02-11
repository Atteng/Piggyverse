
import { create } from 'zustand';

export interface Tournament {
    id: string;
    name: string;
    type: 'battle_royale' | 'pvp' | 'moba' | 'fps';
    game: string; // "poker", "cod", etc.
    host: string;
    entryFee: number;
    tokenType: 'UP' | 'PIGGY';
    prizePool: number;
    maxPlayers: number;
    currentPlayers: number;
    status: 'upcoming' | 'live' | 'completed' | 'cancelled';
    startTime: string;
    description?: string;
    rules?: string;
    bannerImage?: string;
}

interface TournamentState {
    activeTournaments: Tournament[];
    setActiveTournaments: (tournaments: Tournament[]) => void;

    selectedTournament: Tournament | null;
    selectTournament: (tournament: Tournament | null) => void;

    filterType: string | 'all';
    setFilterType: (type: string) => void;

    filterGame: string | 'all';
    setFilterGame: (game: string) => void;
}

export const useTournamentStore = create<TournamentState>()((set) => ({
    activeTournaments: [],
    setActiveTournaments: (tournaments) => set({ activeTournaments: tournaments }),

    selectedTournament: null,
    selectTournament: (tournament) => set({ selectedTournament: tournament }),

    filterType: 'all',
    setFilterType: (type) => set({ filterType: type }),

    filterGame: 'all',
    setFilterGame: (game) => set({ filterGame: game }),
}));
