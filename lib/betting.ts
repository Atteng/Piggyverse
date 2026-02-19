import { BettingMarket, BettingOutcome } from "@prisma/client";

// Standardized odds calculation used by API and Frontend
export function calculateOdds(marketType: string, totalPool: number, outcomeWeight: number, allOutcomes: any[]) {
    let odds = 1.0;

    if (marketType === 'PARIMUTUEL') {
        // Parimutuel: Total Pool / Outcome Pool
        // Note: For accurate parimutuel odds, outcomeWeight should represent the total amount bet on this outcome.
        // If the API hasn't aggregated this, this value might be 0 or raw weight.
        const netPool = totalPool * 0.95; // Assume 5% fee for display purposes
        odds = (totalPool > 0 && outcomeWeight > 0) ? netPool / outcomeWeight : 1.0;
    } else if (marketType === 'WEIGHTED') {
        // Fixed odds
        odds = outcomeWeight || 1.0;
    } else if (marketType === 'BINARY') {
        // Binary defaults to 2.0 (50/50) unless dynamic
        odds = 2.0;
    } else if (marketType === 'SCORE') {
        // Score based markets are dynamic but complex to estimate without full bet history
        odds = 1.0;
    }

    return Math.max(odds, 1.0);
}

// Legacy alias if needed, or just remove it if I fixed usages. 
// I'll keep it as a wrapper to avoid breaking other files if they import it dynamically?
// No, I'll export it as an alias for backward compatibility if I can't check all files.
export const calculateCurrentOdds = (market: any, outcome: any) => {
    return calculateOdds(
        market.marketType,
        (market.totalPool || 0) + (market.poolPreSeed || 0),
        outcome.weight || 0, // In legacy logic 'weight' was used dynamically
        market.outcomes || []
    );
};
