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

        // Distribute poolPreSeed evenly across outcomes as virtual liquidity
        const virtualOutcomePool = outcome.totalBets + (market.poolPreSeed / (market.outcomes.length || 1));

        if (virtualOutcomePool <= 0) {
            // No bets and no seed — use max odds
            odds = MAX_ODDS;
        } else {
            odds = netPool / virtualOutcomePool;
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
 * Persist calculated odds to BettingOutcome.weight and currentOdds in the database.
 * Uses a transaction to ensure atomic updates.
 */
export async function updateMarketWeights(marketId: string): Promise<OutcomeOdds[]> {
    const odds = await calculateLiveOdds(marketId);

    const market = await prisma.bettingMarket.findUnique({
        where: { id: marketId },
        select: { marketType: true }
    });

    await prisma.$transaction(
        odds.map(o =>
            prisma.bettingOutcome.update({
                where: { id: o.outcomeId },
                data: {
                    currentOdds: o.odds,
                    // If it's a weighted market, also update the weight field
                    ...(market?.marketType === 'WEIGHTED' ? { weight: o.odds } : {})
                } as any
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
