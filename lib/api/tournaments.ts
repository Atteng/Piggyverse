export interface TournamentFrontend {
    id: string;
    game: string;
    gameId: string;
    name: string;
    description: string | null;
    registered: number;
    maxPlayers: number;
    prizePool: string;
    entryFee: string;
    status: string;
    startDate: string;
    image: string;
    isIncentivized: boolean;
    bettingAllowed: boolean;
    rules: string[];
    activeMarketId?: string;
    topOutcomes?: {
        id: string;
        label: string;
        odds: number;
    }[];
    token: string;
}

interface APITournament {
    id: string;
    name: string;
    description: string | null;
    gameId: string;
    game: {
        title: string;
        thumbnailUrl: string | null;
    };
    registeredPlayers: number;
    maxPlayers: number;
    prizePoolAmount: number | null;
    prizePoolToken: string | null;
    entryFeeAmount: number | null;
    entryFeeToken: string | null;
    status: string; // PENDING, ACTIVE, COMPLETED, CANCELLED
    startDate: string;
    imageUrl: string | null;
    isIncentivized: boolean;
    allowBetting: boolean;
    rules: string | null;
    bettingMarkets: {
        id: string;
        marketType: string;
        status: string;
        outcomes: {
            id: string;
            label: string;
            currentOdds: number;
        }[];
    }[];
}

interface GetTournamentsResponse {
    tournaments: APITournament[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export async function getTournaments(status?: string, gameId?: string) {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (gameId) params.append("gameId", gameId);

    const response = await fetch(`/api/tournaments?${params.toString()}`);

    if (!response.ok) {
        throw new Error("Failed to fetch tournaments");
    }

    const data: GetTournamentsResponse = await response.json();

    const tournaments: TournamentFrontend[] = data.tournaments.map((t) => {
        // Find the most relevant market for preview (e.g., WINNER or first OPEN one)
        const activeMarket = t.bettingMarkets?.find(m => m.status === 'OPEN' || m.status === 'ACTIVE'); // 'ACTIVE' legacy check

        let topOutcomes = undefined;
        if (activeMarket) {
            // Sort by odds (ascending usually implies favorites) or just take first few
            // Use slice to limit to 4
            topOutcomes = activeMarket.outcomes
                .slice(0, 4)
                .map(o => ({
                    id: o.id,
                    label: o.label,
                    odds: o.currentOdds
                }));
        }

        return {
            id: t.id,
            game: t.game.title,
            gameId: t.gameId,
            name: t.name,
            description: t.description,
            registered: t.registeredPlayers,
            maxPlayers: t.maxPlayers,
            prizePool: t.prizePoolAmount ? `${t.prizePoolAmount.toLocaleString()} ${t.prizePoolToken || "$TOKEN"}` : "None",
            entryFee: t.entryFeeAmount ? `${t.entryFeeAmount} ${t.entryFeeToken || "$TOKEN"}` : "Free",
            status: t.status,
            startDate: t.startDate,
            image: t.imageUrl || t.game.thumbnailUrl || "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=80",
            isIncentivized: t.isIncentivized,
            bettingAllowed: t.allowBetting,
            rules: t.rules ? [t.rules] : [],
            activeMarketId: activeMarket?.id,
            topOutcomes,
            token: t.prizePoolToken || 'USDC'
        };
    });

    return {
        tournaments,
        pagination: data.pagination,
    };
}

export async function createTournament(data: any) {
    const response = await fetch("/api/tournaments", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create tournament");
    }

    return response.json();
}

// Tournament detail and registration
export async function getTournamentDetails(id: string) {
    const res = await fetch(`/api/tournaments/${id}`);
    if (!res.ok) throw new Error('Failed to fetch tournament');
    return res.json();
}

export async function registerForTournament(tournamentId: string) {
    const res = await fetch(`/api/tournaments/${tournamentId}/register`, {
        method: 'POST'
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to register');
    }
    return res.json();
}

export async function unregisterFromTournament(tournamentId: string) {
    const res = await fetch(`/api/tournaments/${tournamentId}/register`, {
        method: 'DELETE'
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to unregister');
    }
    return res.json();
}

export async function updateTournament(id: string, data: any) {
    const res = await fetch(`/api/tournaments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update tournament");
    }

    return res.json();
}

export async function cancelTournament(id: string) {
    const res = await fetch(`/api/tournaments/${id}`, {
        method: 'DELETE'
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to cancel tournament');
    }
    return res.json();
}

export const deleteTournament = cancelTournament;

export async function resolveMarket(marketId: string, outcomeId: string) {
    const res = await fetch(`/api/tournaments/resolve-market`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marketId, outcomeId })
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to resolve market");
    }

    return res.json();
}

export async function updateMarket(marketId: string, data: any) {
    const res = await fetch(`/api/betting/markets/${marketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update market");
    }

    return res.json();
}

export async function createMarket(data: any) {
    const res = await fetch(`/api/betting/markets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create market");
    }

    return res.json();
}
export async function syncTournamentResults(id: string) {
    const res = await fetch(`/api/tournaments/${id}/verify`, {
        method: "POST"
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to sync results");
    }

    return res.json();
}
