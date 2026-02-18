/**
 * Centralized Statistics Utility for PiggyVerse
 * Implements the 50/35/15 Ranking System:
 * - Effort (50%): Hosting tournaments, seeding prize pools, creating markets
 * - Proficiency (35%): Tournament wins, match wins/losses
 * - Activity (15%): Hours played and watched
 */

import { prisma } from '@/lib/prisma';
import type { User, UserStats } from '@prisma/client';

/**
 * Token Prices in USD (Fallbacks for UI and legacy display)
 * Note: Live pricing is fetched via lib/price-oracle.ts during events
 */
export const TOKEN_PRICES: Record<string, number> = {
    'USDC': 1,
    'TUSDC': 1,
    'PIGGY': 0.05,
    'UP': 0.1,
    'ETH': 3000
};

/**
 * Get USD value for a given token amount (Synchronous fallback)
 */
export function getTokenValue(token: string, amount: number): number {
    const price = TOKEN_PRICES[token.toUpperCase()] || 0;
    return amount * price;
}

/**
 * Calculate Effort Score (50% of Global Rank)
 * Based on hosting tournaments, seeding prize pools, and creating betting markets
 */
export function calculateEffortScore(stats: UserStats): number {
    const tournamentsHostedPoints = stats.tournamentsHosted * 10;
    // $5 seeded = 5 points -> 1 point per $1
    const prizePoolPoints = stats.prizePoolsSeeded;
    const marketsCreatedPoints = stats.marketsCreated * 5;

    return tournamentsHostedPoints + prizePoolPoints + marketsCreatedPoints;
}

/**
 * Calculate Proficiency Score (35% of Global Rank)
 * Based on tournament wins, match wins, and match losses
 */
export function calculateProficiencyScore(stats: UserStats): number {
    const tournamentWinPoints = stats.tournamentsWon * 50;
    const matchWinPoints = stats.matchWins * 10;
    const matchLossPenalty = stats.matchLosses * 2;

    return Math.max(0, tournamentWinPoints + matchWinPoints - matchLossPenalty);
}

/**
 * Calculate Activity Score (15% of Global Rank)
 * Based on hours played and hours watched
 */
export function calculateActivityScore(stats: UserStats): number {
    const hoursPlayedPoints = stats.totalHoursPlayed * 5;
    // 10 points per hour watched
    const hoursWatchedPoints = stats.totalHoursWatched * 10;

    return hoursPlayedPoints + hoursWatchedPoints;
}

/**
 * Calculate Global Rank using the 50/35/15 formula
 */
export function calculateGlobalRank(user: User & { stats: UserStats | null }): number {
    if (!user.stats) return 0;

    const effortScore = calculateEffortScore(user.stats);
    const proficiencyScore = calculateProficiencyScore(user.stats);
    const activityScore = calculateActivityScore(user.stats);

    // Weighted sum: 50% Effort + 35% Proficiency + 15% Activity
    const globalRank = (effortScore * 0.50) + (proficiencyScore * 0.35) + (activityScore * 0.15);

    return Math.round(globalRank);
}

/**
 * Update a user's global rank and component scores
 * Call this after any stat-changing event
 */
export async function updateUserRank(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { stats: true }
    });

    if (!user) {
        throw new Error(`User ${userId} not found`);
    }

    // Ensure stats exist
    if (!user.stats) {
        await prisma.userStats.create({
            data: { userId }
        });
        // Refetch with stats
        return updateUserRank(userId);
    }

    const effortScore = calculateEffortScore(user.stats);
    const proficiencyScore = calculateProficiencyScore(user.stats);
    const activityScore = calculateActivityScore(user.stats);
    const globalRank = calculateGlobalRank(user);

    await prisma.user.update({
        where: { id: userId },
        data: {
            effortScore,
            proficiencyScore,
            activityScore,
            globalRank,
            needsRankUpdate: false // Clear the flag
        }
    });
}

/**
 * Update a user's game-specific leaderboard entry
 */
export async function updateGameLeaderboard(userId: string, gameId: string, stats: {
    matchWins?: number;
    tournamentsWon?: number;
    timePlayedHours?: number;
}): Promise<void> {
    const entry = await prisma.leaderboardEntry.upsert({
        where: {
            userId_gameId: {
                userId,
                gameId
            }
        },
        create: {
            userId,
            gameId,
            matchWins: stats.matchWins || 0,
            tournamentsWon: stats.tournamentsWon || 0,
            timePlayedHours: stats.timePlayedHours || 0,
            rank: 999999, // default rank, will be updated by a scheduled job or trigger
            totalScore: 0
        },
        update: {
            matchWins: stats.matchWins ? { increment: stats.matchWins } : undefined,
            tournamentsWon: stats.tournamentsWon ? { increment: stats.tournamentsWon } : undefined,
            timePlayedHours: stats.timePlayedHours ? { increment: stats.timePlayedHours } : undefined,
        }
    });

    // Calculate score for this game (Basic implementation)
    // Score = (Wins * 10) + (Tourneys * 50) + (Hours * 5)
    const newScore = (entry.matchWins * 10) + (entry.tournamentsWon * 50) + (entry.timePlayedHours * 5);

    await prisma.leaderboardEntry.update({
        where: { id: entry.id },
        data: { totalScore: newScore }
    });

    // Note: Re-ranking all players for this game is expensive and should be done via background job
    // For now, we update the score which allows for sorting
}

/**
 * Increment tournament hosted count and update rank
 */
export async function incrementTournamentsHosted(userId: string): Promise<void> {
    await prisma.userStats.upsert({
        where: { userId },
        create: { userId, tournamentsHosted: 1 },
        update: { tournamentsHosted: { increment: 1 } }
    });
    await updateUserRank(userId);
}

/**
 * Increment prize pool seeded amount and update rank
 */
export async function incrementPrizePoolSeeded(userId: string, amount: number): Promise<void> {
    await prisma.userStats.upsert({
        where: { userId },
        create: { userId, prizePoolsSeeded: amount },
        update: { prizePoolsSeeded: { increment: amount } }
    });
    await updateUserRank(userId);
}

/**
 * Increment markets created count and update rank
 */
export async function incrementMarketsCreated(userId: string, count: number = 1): Promise<void> {
    await prisma.userStats.upsert({
        where: { userId },
        create: { userId, marketsCreated: count },
        update: { marketsCreated: { increment: count } }
    });
    await updateUserRank(userId);
}

/**
 * Record a tournament win and update rank
 */
export async function recordTournamentWin(userId: string, gameId?: string): Promise<void> {
    await prisma.userStats.upsert({
        where: { userId },
        create: { userId, tournamentsWon: 1 },
        update: { tournamentsWon: { increment: 1 } }
    });
    await updateUserRank(userId);

    if (gameId) {
        await updateGameLeaderboard(userId, gameId, { tournamentsWon: 1 });
    }
}

/**
 * Record a match result and update ranks for both players
 */
export async function recordMatchResult(winnerId: string, loserId: string, gameId?: string): Promise<void> {
    // Update winner
    await prisma.userStats.upsert({
        where: { userId: winnerId },
        create: { userId: winnerId, matchWins: 1 },
        update: { matchWins: { increment: 1 } }
    });

    // Update loser
    await prisma.userStats.upsert({
        where: { userId: loserId },
        create: { userId: loserId, matchLosses: 1 },
        update: { matchLosses: { increment: 1 } }
    });

    // Update ranks for both
    await Promise.all([
        updateUserRank(winnerId),
        updateUserRank(loserId)
    ]);

    if (gameId) {
        await updateGameLeaderboard(winnerId, gameId, { matchWins: 1 });
        // Optionally track losses in leaderboard_entries if schema supported it
    }
}

/**
 * Increment hours watched and update rank
 */
export async function incrementHoursWatched(userId: string, hours: number): Promise<void> {
    await prisma.userStats.upsert({
        where: { userId },
        create: { userId, totalHoursWatched: hours },
        update: { totalHoursWatched: { increment: hours } }
    });
    await updateUserRank(userId);
}

/**
 * Increment hours played and update rank
 */
export async function incrementHoursPlayed(userId: string, hours: number, gameId?: string): Promise<void> {
    await prisma.userStats.upsert({
        where: { userId },
        create: { userId, totalHoursPlayed: hours },
        update: { totalHoursPlayed: { increment: hours } }
    });
    await updateUserRank(userId);

    if (gameId) {
        await updateGameLeaderboard(userId, gameId, { timePlayedHours: Math.round(hours) }); // DB uses Int
    }
}
