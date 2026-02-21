
/**
 * Centralized Tournament Logic
 */

import { Tournament } from "@prisma/client";
import { prisma } from '@/lib/prisma';

/**
 * Calculate the live prize pool for a tournament.
 * 
 * Logic:
 * Prize Pool = Seed Amount + (Confirmed Registrations * Entry Fee)
 * 
 * @param tournament The tournament object (must include basic fields)
 * @param entryFeeAmount The entry fee amount (optional, defaults to tournament.entryFeeAmount)
 * @param registeredCount The number of registered players (optional, defaults to tournament.registeredPlayers)
 * @param seedAmount The seed amount (optional, defaults to tournament.prizePoolSeed or prizePoolAmount if seed is missing)
 */
export function calculateLivePrizePool(
    tournament: {
        prizePoolSeed?: number | null;
        prizePoolAmount?: number | null;
        entryFeeAmount?: number | null;
        registeredPlayers?: number;
        // Allow for extended properties if passed
        [key: string]: any;
    },
    registeredCount?: number
): number {
    const seed = tournament.prizePoolSeed ?? 0;
    const fee = tournament.entryFeeAmount ?? 0;
    const count = registeredCount ?? tournament.registeredPlayers ?? 0;

    // Revenue from players
    const revenue = count * fee;

    return seed + revenue;
}

/**
 * Automatically verify and settle a poker tournament.
 * Extracts table ID, verifies results, updates final standings/ranks, and settles betting markets.
 */
import { pokerVerifier } from '@/lib/poker-verifier';
import { settleMarket } from '@/lib/betting/settlement';

export async function settleTournamentBets(tournamentId: string, useFullCSV: boolean = false) {
    // 1. Get tournament details from database
    const tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId },
        include: {
            bettingMarkets: {
                include: {
                    bets: true,
                    outcomes: true,
                },
            },
        },
    });

    if (!tournament) throw new Error('Tournament not found');

    const metadata = (tournament as any).metadata;
    let tableId = metadata?.pokerNowTableId as string;

    if (!tableId && tournament.lobbyUrl) {
        const { extractPokerNowTableId } = await import('@/lib/utils/pokernow');
        tableId = extractPokerNowTableId(tournament.lobbyUrl) || '';

        if (tableId) {
            await prisma.tournament.update({
                where: { id: tournamentId },
                data: { metadata: { ...metadata, pokerNowTableId: tableId } }
            });
        }
    }

    if (!tableId) throw new Error('No PokerNow table ID found');

    // 2. Fetch and verify results
    console.log(`Verifying tournament ${tournamentId} (table: ${tableId}). Mode: ${useFullCSV ? 'CSV Bypass' : 'Incremental Polling'}`);
    const result = useFullCSV
        ? await pokerVerifier.verifyTournamentFullCSV(tableId)
        : await pokerVerifier.verifyTournament(tableId);

    if (!result.verified) {
        console.warn(`[Tournament ${tournamentId}] Settlement paused/aborted: ${result.verificationError}`);
        return result; // Return gracefully instead of throwing a generic 500 error
    }

    // 3. Persist final ranks out to the Registration table
    const registrations = await prisma.tournamentRegistration.findMany({
        where: { tournamentId },
        include: { user: { select: { username: true } } }
    });

    if (result.finalStandings) {
        // Update player ranks sequentially to avoid exhausting the database connection pool
        let updateCount = 0;
        for (const standing of result.finalStandings) {
            const reg = registrations.find(r =>
                r.user.username?.toLowerCase() === standing.player.toLowerCase()
            );

            if (reg) {
                await prisma.tournamentRegistration.update({
                    where: { id: reg.id },
                    data: { finalRank: standing.position }
                });
                updateCount++;
            }
        }
        console.log(`Saved final rankings for ${updateCount} players.`);
    }

    // 4. Update tournament with verified results
    // Map the PokerNow winner name to a database User ID if they are registered
    const winnerRegistration = registrations.find(r =>
        r.user.username?.toLowerCase() === result.winner?.toLowerCase()
    );
    const databaseWinnerId = winnerRegistration?.userId || null;

    await prisma.tournament.update({
        where: { id: tournamentId },
        data: {
            winnerId: databaseWinnerId,
            status: 'COMPLETED',
            metadata: {
                ...metadata,
                verifiedResults: {
                    totalHands: result.totalHands,
                    finalStandings: result.finalStandings,
                    verifiedAt: new Date().toISOString(),
                },
            },
        } as any,
    });

    // 5. Settle betting markets
    for (const market of tournament.bettingMarkets) {
        const winningOutcome = market.outcomes.find(o => o.label === result.winner);

        if (!winningOutcome) {
            console.warn(`No outcome found for winner ${result.winner} in market ${market.id}`);
            continue;
        }

        try {
            const settlementResult = await settleMarket(market.id, winningOutcome.id);
            console.log(`Market ${market.id} settled. Winner: ${winningOutcome.label}. Payouts: ${settlementResult.totalPaidOut}`);
        } catch (error) {
            console.error(`Failed to settle market ${market.id}:`, error);
        }
    }

    // 6. Update User Stats (Wins, Match Metrics, Effort)
    try {
        const { processTournamentResults } = await import('@/lib/stats');
        await processTournamentResults(tournamentId, result, registrations);
        console.log(`[Tournament ${tournamentId}] Stats processing completed.`);
    } catch (error) {
        console.error(`[Tournament ${tournamentId}] Stats processing failed:`, error);
    }

    return result;
}
