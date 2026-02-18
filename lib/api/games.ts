
export interface GameFrontend {
    id: string;
    title: string;
    description?: string;
    thumbnailUrl: string | null;
    thumbnail: string;
    categories: string[];
    platforms?: string[];
    playerCount: string;
    tournamentStatus?: string | null;
    prizePool?: string | null;
    bettingAllowed?: boolean;
    gameUrl?: string | null;
    hasOracleIntegration?: boolean;
    createdById?: string;
    isListed?: boolean;
    uploaderName?: string;
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
    createdById: string;
    createdBy?: {
        id: string;
        username: string | null;
        avatarUrl: string | null;
    };
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
    sort?: 'popular' | 'newest';
}

export async function getGames(options: GetGamesOptions = {}) {
    const { page = 1, search = "", limit = 12, sort = "popular" } = options;

    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sort,
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
        description: game.description,
        thumbnailUrl: game.thumbnailUrl || null,
        thumbnail: game.thumbnailUrl || "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80",
        categories: game.categories,
        platforms: game.platforms,
        playerCount: game.playerCount.toLocaleString(),
        tournamentStatus: (game as any)._count?.tournaments > 0 ? "ACTIVE" : null,
        prizePool: null,
        bettingAllowed: game.hasOracleIntegration || false,
        gameUrl: game.gameUrl || null,
        hasOracleIntegration: game.hasOracleIntegration || false,
        createdById: game.createdBy?.id || game.createdById,
        isListed: game.isListed,
        uploaderName: game.createdBy?.username || "Admin",
    }));

    return {
        games,
        pagination: data.pagination,
    };
}

export async function updateGame(id: string, data: Partial<GameFrontend>) {
    const response = await fetch(`/api/games/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update game");
    }

    return response.json();
}

export async function deleteGame(id: string) {
    const response = await fetch(`/api/games/${id}`, {
        method: "DELETE",
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete game");
    }

    return response.json();
}
