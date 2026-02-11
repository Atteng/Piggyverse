
export interface GameFrontend {
    id: string;
    title: string;
    thumbnailUrl: string | null;
    thumbnail: string;
    categories: string[];
    playerCount: string;
    tournamentStatus?: string | null;
    prizePool?: string | null;
    bettingAllowed?: boolean;
    gameUrl?: string | null;
    hasOracleIntegration?: boolean;
}

interface APIGame {
    id: string;
    title: string;
    description?: string;
    thumbnailUrl?: string;
    gameUrl?: string;
    categories: string[];
    platforms: string[];
    playerCount: number;
    isListed: boolean;
    createdAt: string;
    hasOracleIntegration?: boolean;
}

interface GetGamesResponse {
    games: APIGame[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface GetGamesOptions {
    page?: number;
    search?: string;
    limit?: number;
}

export async function getGames(options: GetGamesOptions = {}) {
    const { page = 1, search = "", limit = 12 } = options;

    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
    });

    if (search) {
        params.append("search", search);
    }

    const response = await fetch(`/api/games?${params.toString()}`);

    if (!response.ok) {
        throw new Error("Failed to fetch games");
    }

    const data: GetGamesResponse = await response.json();

    // Map Backend Game to Frontend Interface
    const games: GameFrontend[] = data.games.map((game) => ({
        id: game.id,
        title: game.title,
        thumbnailUrl: game.thumbnailUrl || null,
        thumbnail: game.thumbnailUrl || "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80",
        categories: game.categories,
        playerCount: game.playerCount.toLocaleString(),
        tournamentStatus: null, // Placeholder
        prizePool: null, // Placeholder
        bettingAllowed: true, // Placeholder
        gameUrl: game.gameUrl || null,
        hasOracleIntegration: game.hasOracleIntegration || false,
    }));

    return {
        games,
        pagination: data.pagination,
    };
}
