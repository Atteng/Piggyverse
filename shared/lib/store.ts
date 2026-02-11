import { create } from 'zustand';

interface User {
  id: string;
  address: string;
  effortScore: number;
  proficiencyScore: number;
  activityScore: number;
  globalRank: number;
}

interface UserStore {
  user: User | null;
  setUser: (user: User | null) => void;
  updateScores: (scores: Partial<Pick<User, 'effortScore' | 'proficiencyScore' | 'activityScore'>>) => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  updateScores: (scores) => set((state) => ({
    user: state.user ? { ...state.user, ...scores } : null
  })),
}));
