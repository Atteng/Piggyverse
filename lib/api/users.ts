export interface UserStats {
    tournamentsHosted: number;
    tournamentsWon: number;
    totalMatchesWon: number;
    totalHoursPlayed: number;
    tokensEarned: number;
    currentStreak: number;
}

export interface UserProfile {
    id: string;
    username: string;
    avatarUrl: string | null;
    stats: UserStats | null;
}

export async function getUserProfile() {
    const response = await fetch("/api/users/me");

    if (response.status === 401) {
        return null; // Not logged in
    }

    if (!response.ok) {
        throw new Error("Failed to fetch user profile");
    }

    return response.json() as Promise<UserProfile>;
}
