/**
 * Betting Market Settlement Utility
 * Implements risk-neutral payout calculations for all market types
 */

import { prisma } from '@/lib/prisma';
import type { MarketType, Bet, BettingOutcome } from '@prisma/client';

interface SettlementResult {
    betsUpdated: number;
    totalPaidOut: number;
    settlementData: any;
}

interface MarketData {
    id: string;
    marketType: MarketType;
    poolPreSeed: number;
    bookmakingFee: number;
    totalPool: number;
    outcomes: (BettingOutcome & { bets: Bet[] })[];
}

/**
 * Calculate net pool after fees
 */
function calculateNetPool(totalBets: number, seed: number, fee: number): number {
    return (totalBets + seed) * (1 - fee);
}

/**
 * PARIMUTUEL Settlement
 * All bets on winning outcome split the net pool proportionally
 */
function settleParimutuel(
    market: MarketData,
    winningOutcomeId: string
): { bet: Bet; payout: number }[] {
    const netPool = calculateNetPool(market.totalPool, market.poolPreSeed, market.bookmakingFee);

    const winningOutcome = market.outcomes.find(o => o.id === winningOutcomeId);
    if (!winningOutcome) throw new Error('Winning outcome not found');

    const winningBets = winningOutcome.bets;
    const winningPool = winningBets.reduce((sum, bet) => sum + bet.amount, 0);

    if (winningPool === 0) {
        // No winning bets - pool goes to house/seed
        return [];
    }

    return winningBets.map(bet => ({
        bet,
        payout: (bet.amount / winningPool) * netPool
    }));
}

/**
 * WEIGHTED Settlement
 * Payouts based on proportional claims (amount × weight)
 * Risk-neutral: scales down if total claims exceed pool
 */
function settleWeighted(
    market: MarketData,
    winningOutcomeId: string
): { bet: Bet; payout: number }[] {
    const netPool = calculateNetPool(market.totalPool, market.poolPreSeed, market.bookmakingFee);

    const winningOutcome = market.outcomes.find(o => o.id === winningOutcomeId);
    if (!winningOutcome || !winningOutcome.weight) {
        throw new Error('Winning outcome not found or missing weight');
    }

    const winningBets = winningOutcome.bets;

    // Calculate total claims
    const totalClaims = winningBets.reduce((sum, bet) => {
        return sum + (bet.amount * winningOutcome.weight!);
    }, 0);

    if (totalClaims === 0) return [];

    // Risk-neutral scaling: if claims > pool, scale down proportionally
    return winningBets.map(bet => {
        const claim = bet.amount * winningOutcome.weight!;
        const payout = (claim / totalClaims) * netPool;
        return { bet, payout };
    });
}

/**
 * BINARY Settlement
 * Fixed odds at bet placement time
 * Note: This is NOT risk-neutral and requires careful pool management
 */
function settleBinary(
    market: MarketData,
    winningOutcomeId: string
): { bet: Bet; payout: number }[] {
    const winningOutcome = market.outcomes.find(o => o.id === winningOutcomeId);
    if (!winningOutcome || !winningOutcome.weight) {
        throw new Error('Winning outcome not found or missing odds');
    }

    const winningBets = winningOutcome.bets;

    return winningBets.map(bet => ({
        bet,
        payout: bet.amount * winningOutcome.weight! // weight = fixed odds
    }));
}

/**
 * SCORE Settlement
 * Closest-to-actual score wins proportionally
 * settlementData must include { actualScore: number }
 */
function settleScore(
    market: MarketData,
    winningOutcomeId: string,
    settlementData: { actualScore: number }
): { bet: Bet; payout: number }[] {
    const netPool = calculateNetPool(market.totalPool, market.poolPreSeed, market.bookmakingFee);
    const { actualScore } = settlementData;

    // Collect all bets with their predicted scores
    const allBets = market.outcomes.flatMap(outcome =>
        outcome.bets.map(bet => ({
            bet,
            predictedScore: parseFloat(outcome.label) // Assuming label is the score
        }))
    );

    // Calculate accuracy for each bet (inverse of distance)
    const betsWithAccuracy = allBets.map(({ bet, predictedScore }) => {
        const distance = Math.abs(predictedScore - actualScore);
        const accuracy = 1 / (distance + 1); // +1 to avoid division by zero
        return { bet, accuracy };
    });

    const totalAccuracy = betsWithAccuracy.reduce((sum, b) => sum + b.accuracy, 0);

    if (totalAccuracy === 0) return [];

    // Distribute pool based on accuracy
    return betsWithAccuracy.map(({ bet, accuracy }) => ({
        bet,
        payout: (accuracy / totalAccuracy) * netPool
    }));
}

/**
 * Main settlement function
 * Settles a market and updates all bets with payout amounts
 */
export async function settleMarket(
    marketId: string,
    winningOutcomeId: string,
    settlementData?: any
): Promise<SettlementResult> {
    const market = await prisma.bettingMarket.findUnique({
        where: { id: marketId },
        include: {
            outcomes: {
                include: {
                    bets: true
                }
            }
        }
    });

    if (!market) throw new Error('Market not found');
    if (market.status === 'SETTLED') throw new Error('Market already settled');

    let payouts: { bet: Bet; payout: number }[];

    // Calculate payouts based on market type
    switch (market.marketType) {
        case 'PARIMUTUEL':
            payouts = settleParimutuel(market, winningOutcomeId);
            break;
        case 'WEIGHTED':
            payouts = settleWeighted(market, winningOutcomeId);
            break;
        case 'BINARY':
            payouts = settleBinary(market, winningOutcomeId);
            break;
        case 'SCORE':
            if (!settlementData?.actualScore) {
                throw new Error('SCORE markets require actualScore in settlementData');
            }
            payouts = settleScore(market, winningOutcomeId, settlementData);
            break;
        default:
            throw new Error(`Unknown market type: ${market.marketType}`);
    }

    // Update all bets with payout amounts
    const updatePromises = payouts.map(({ bet, payout }) =>
        prisma.bet.update({
            where: { id: bet.id },
            data: {
                payoutAmount: payout,
                status: 'WON'
            }
        })
    );

    // Mark losing bets
    const losingBets = market.outcomes
        .filter(o => o.id !== winningOutcomeId)
        .flatMap(o => o.bets);

    const losingUpdatePromises = losingBets.map(bet =>
        prisma.bet.update({
            where: { id: bet.id },
            data: {
                payoutAmount: 0,
                status: 'LOST'
            }
        })
    );

    await Promise.all([...updatePromises, ...losingUpdatePromises]);

    // Update market status
    await prisma.bettingMarket.update({
        where: { id: marketId },
        data: {
            status: 'SETTLED',
            winningOutcomeId,
            // Store settlement metadata if needed
        }
    });

    const totalPaidOut = payouts.reduce((sum, p) => sum + p.payout, 0);

    return {
        betsUpdated: payouts.length + losingBets.length,
        totalPaidOut,
        settlementData: {
            winningOutcomeId,
            payouts: payouts.map(p => ({
                betId: p.bet.id,
                amount: p.payout
            })),
            ...settlementData
        }
    };
}

/**
 * Get settlement preview without committing
 * Useful for showing potential payouts before settlement
 */
export async function previewSettlement(
    marketId: string,
    winningOutcomeId: string,
    settlementData?: any
): Promise<{ betId: string; userId: string; payout: number }[]> {
    const market = await prisma.bettingMarket.findUnique({
        where: { id: marketId },
        include: {
            outcomes: {
                include: {
                    bets: true
                }
            }
        }
    });

    if (!market) throw new Error('Market not found');

    let payouts: { bet: Bet; payout: number }[];

    switch (market.marketType) {
        case 'PARIMUTUEL':
            payouts = settleParimutuel(market, winningOutcomeId);
            break;
        case 'WEIGHTED':
            payouts = settleWeighted(market, winningOutcomeId);
            break;
        case 'BINARY':
            payouts = settleBinary(market, winningOutcomeId);
            break;
        case 'SCORE':
            if (!settlementData?.actualScore) {
                throw new Error('SCORE markets require actualScore');
            }
            payouts = settleScore(market, winningOutcomeId, settlementData);
            break;
        default:
            throw new Error(`Unknown market type: ${market.marketType}`);
    }

    return payouts.map(p => ({
        betId: p.bet.id,
        userId: p.bet.userId,
        payout: p.payout
    }));
}
