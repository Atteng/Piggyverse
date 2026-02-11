// API client for betting operations
export async function getBettingMarkets(tournamentId: string) {
    const res = await fetch(`/api/betting/markets?tournamentId=${tournamentId}`);
    if (!res.ok) throw new Error('Failed to fetch betting markets');
    const data = await res.json();
    return data.markets || [];
}

export async function placeBet(data: {
    marketId: string;
    outcomeId: string;
    amount: number;
    token: string;
}) {
    const res = await fetch('/api/betting/bets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to place bet');
    }
    return res.json();
}

export async function getUserBets() {
    const res = await fetch('/api/betting/bets');
    if (!res.ok) throw new Error('Failed to fetch user bets');
    return res.json();
}

export async function settleBettingMarket(marketId: string, winningOutcomeId: string) {
    const res = await fetch(`/api/betting/markets/${marketId}/settle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winningOutcomeId })
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to settle market');
    }
    return res.json();
}
