import { BettingMarket, BettingOutcome } from "@prisma/client";

// Standardized odds calculation used by API and Frontend
export function calculateOdds(
    marketType: string,
    totalPool: number,
    outcomeWeight: number,
    allOutcomes: any[],
    feePercent: number = 0
) {
    let odds = 1.0;

    if (marketType === 'PARIMUTUEL') {
        const netPool = totalPool * (1 - (feePercent / 100));

        if (outcomeWeight > 0) {
            odds = netPool / outcomeWeight;
        } else if (allOutcomes.length > 0) {
            // Initial/Estimated odds before any bets
            // If No bets, assume a fair split of the pool
            odds = netPool / (netPool / allOutcomes.length); // Basically allOutcomes.length
        } else {
            odds = 1.0;
        }
    } else if (marketType === 'WEIGHTED') {
        odds = outcomeWeight || 1.0;
    } else if (marketType === 'BINARY') {
        odds = 2.0;
    } else if (marketType === 'SCORE') {
        odds = 1.0;
    }

    return Math.max(odds, 1.0);
}

export const calculateCurrentOdds = (market: any, outcome: any) => {
    // For PARIMUTUEL, we use totalBets as the denominator (weight is for fixed odds / output cache)
    // For WEIGHTED, weight is the fixed odds multiplier
    const weight = market.marketType === 'PARIMUTUEL'
        ? (outcome.totalBets || 0)
        : (outcome.weight || 0);

    return calculateOdds(
        market.marketType,
        (market.totalPool || 0) + (market.poolPreSeed || 0),
        weight,
        market.outcomes || [],
        market.bookmakingFee || 0
    );
};
