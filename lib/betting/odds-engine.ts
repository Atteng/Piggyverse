/**
 * Odds Engine — Phase 1: Core Autonomy
 * 
 * Calculates live Parimutuel odds for betting markets.
 * Updates BettingOutcome.weight in the database.
 */

import { prisma } from '@/lib/prisma';

// Minimum odds to prevent "infinite odds" on empty pools
const MIN_ODDS = 1.01;
const MAX_ODDS = 100.0;

interface OutcomeOdds {
    outcomeId: string;
    label: string;
    odds: number;
    totalBets: number;
    betCount: number;
}

/**
 * Calculate live Parimutuel odds for all outcomes in a market.
 * Formula: (TotalPool × (1 − Fee)) / OutcomePool
 * 
 * Returns clamped odds between MIN_ODDS and MAX_ODDS.
 */
export async function calculateLiveOdds(marketId: string): Promise<OutcomeOdds[]> {
    const market = await prisma.bettingMarket.findUnique({
        where: { id: marketId },
        include: {
            outcomes: true
        }
    });

    if (!market) throw new Error(`Market ${marketId} not found`);

    const netPool = (market.totalPool + market.poolPreSeed) * (1 - market.bookmakingFee);

    return market.outcomes.map(outcome => {
        let odds: number;

        if (outcome.totalBets <= 0) {
            // No bets on this outcome — use seed-based minimum
            odds = market.outcomes.length > 0
                ? Math.min(MAX_ODDS, market.outcomes.length * 2) // Rough initial odds
                : MIN_ODDS;
        } else {
            odds = netPool / outcome.totalBets;
        }

        // Clamp odds to safe range
        odds = Math.max(MIN_ODDS, Math.min(MAX_ODDS, odds));

        return {
            outcomeId: outcome.id,
            label: outcome.label,
            odds: Math.round(odds * 100) / 100, // 2 decimal places
            totalBets: outcome.totalBets,
            betCount: outcome.betCount,
        };
    });
}

/**
 * Persist calculated odds to BettingOutcome.weight in the database.
 * Uses a transaction to ensure atomic updates.
 */
export async function updateMarketWeights(marketId: string): Promise<OutcomeOdds[]> {
    const odds = await calculateLiveOdds(marketId);

    await prisma.$transaction(
        odds.map(o =>
            prisma.bettingOutcome.update({
                where: { id: o.outcomeId },
                data: { weight: o.odds }
            })
        )
    );

    return odds;
}

/**
 * Get the current odds for a specific outcome.
 * Used when placing a bet to lock in oddsAtPlacement.
 */
export async function getOutcomeOdds(marketId: string, outcomeId: string): Promise<number> {
    const odds = await calculateLiveOdds(marketId);
    const outcome = odds.find(o => o.outcomeId === outcomeId);

    if (!outcome) throw new Error(`Outcome ${outcomeId} not found in market ${marketId}`);

    return outcome.odds;
}
