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
            rank: 999999, // default rank, will be updated by updateGameRanks
            totalScore: 0
        },
        update: {
            matchWins: stats.matchWins ? { increment: stats.matchWins } : undefined,
            tournamentsWon: stats.tournamentsWon ? { increment: stats.tournamentsWon } : undefined,
            timePlayedHours: stats.timePlayedHours ? { increment: stats.timePlayedHours } : undefined,
        }
    });

    // Calculate score for this game (Balanced implementation)
    // Wins (100) + Tourneys (1000) + Hours (50)
    const newScore = (entry.matchWins * 100) + (entry.tournamentsWon * 1000) + (entry.timePlayedHours * 50);

    await prisma.leaderboardEntry.update({
        where: { id: entry.id },
        data: { totalScore: newScore }
    });

    // Trigger persistent rank update for this specific game
    // This is non-blocking to keep response fast
    updateGameRanks(gameId).catch(err =>
        console.error(`[Leaderboard] Failed to update ranks for game ${gameId}:`, err)
    );
}

/**
 * Persistently update all ranks for a specific game
 */
export async function updateGameRanks(gameId: string): Promise<void> {
    const entries = await prisma.leaderboardEntry.findMany({
        where: { gameId },
        orderBy: { totalScore: 'desc' }
    });

    // Update each entry with its new rank
    for (let i = 0; i < entries.length; i++) {
        await prisma.leaderboardEntry.update({
            where: { id: entries[i].id },
            data: { rank: i + 1 }
        });
    }
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

/**
 * Process final tournament results and update stats for all participants
 * This is the central point for award/rank logic after a tournament settles.
 */
export async function processTournamentResults(
    tournamentId: string,
    result: {
        winner: string;
        finalStandings: any[];
        playerStats?: Map<string, { handsPlayed: number, handsWon: number }>
    },
    registrations: any[] // Registration objects with user.username and userId
): Promise<void> {
    console.log(`[Stats-Engine] Processing results for tournament ${tournamentId}...`);

    // 1. Identify the Winner (Proficiency)
    const winnerReg = registrations.find(r =>
        r.user.username?.toLowerCase() === result.winner?.toLowerCase()
    );

    if (winnerReg) {
        console.log(`[Stats-Engine] Recording win for ${winnerReg.user.username}`);
        await recordTournamentWin(winnerReg.userId);
    }

    // 2. Process Performance & Activity for all participants
    // We iterate through registrations to ensure we only update users who were actually in our DB
    for (const reg of registrations) {
        const username = reg.user.username?.toLowerCase();
        if (!username) continue;

        const pStats = result.playerStats?.get(username);
        const standing = result.finalStandings?.find(s => s.player.toLowerCase() === username);

        if (pStats || standing) {
            // MATCH WINS (Proficiency)
            const wins = pStats?.handsWon || 0;
            const played = pStats?.handsPlayed || 0;
            const losses = played - wins;

            if (played > 0) {
                await prisma.userStats.upsert({
                    where: { userId: reg.userId },
                    create: { userId: reg.userId, matchWins: wins, matchLosses: losses },
                    update: {
                        matchWins: { increment: wins },
                        matchLosses: { increment: losses }
                    }
                });

                // ACTIVITY (15%) - Estimate hours (approx 1 min per hand if not provided)
                const hoursPlayed = played / 60;
                await prisma.userStats.update({
                    where: { userId: reg.userId },
                    data: { totalHoursPlayed: { increment: hoursPlayed } }
                });
            }

            // PROFICIENCY - Update Game-Specific Leaderboard
            const tournament = await prisma.tournament.findUnique({
                where: { id: tournamentId },
                select: { gameId: true }
            });

            if (tournament?.gameId) {
                await updateGameLeaderboard(reg.userId, tournament.gameId, {
                    matchWins: wins,
                    tournamentsWon: (winnerReg?.userId === reg.userId) ? 1 : 0,
                    timePlayedHours: pStats ? Math.round(pStats.handsPlayed / 60) : 0
                });
            }

            // Final Rank Update
            await updateUserRank(reg.userId).catch(e => console.error(`Failed to update rank for ${reg.userId}:`, e));
        }
    }

    // 3. Mark the Host for Effort Reprocessing
    const tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId },
        select: { hostId: true }
    });

    if (tournament?.hostId) {
        // Incrementing Hosted count already happens at creation, but let's ensure rank is fresh
        await updateUserRank(tournament.hostId);
    }
}
