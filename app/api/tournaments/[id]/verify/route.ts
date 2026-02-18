/**
 * Example: Integrate PokerNow verification with tournament settlement
 * 
 * This shows how to automatically verify and settle bets when a tournament ends
 */

import { pokerVerifier } from '@/lib/poker-verifier';
import { prisma } from '@/lib/prisma';
import { settleMarket } from '@/lib/betting/settlement';

/**
 * Automatically verify and settle a poker tournament
 * Call this when a tournament is marked as completed
 */
export async function settleTournamentBets(tournamentId: string) {
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

    if (!tournament) {
        throw new Error('Tournament not found');
    }

    // 2. Extract table ID (with self-healing for legacy tournaments)
    const metadata = (tournament as any).metadata;
    let tableId = metadata?.pokerNowTableId as string;

    // SELF-HEALING: If metadata is missing but we have a PokerNow lobby URL, extract it on the fly
    if (!tableId && tournament.lobbyUrl) {
        const { extractPokerNowTableId } = await import('@/lib/utils/pokernow');
        tableId = extractPokerNowTableId(tournament.lobbyUrl) || '';

        if (tableId) {
            console.log(`Self-healing: Extracted tableId ${tableId} from lobbyUrl for tournament ${tournamentId}`);
            // Optionally update the metadata in the DB for next time
            await prisma.tournament.update({
                where: { id: tournamentId },
                data: {
                    metadata: {
                        ...metadata,
                        pokerNowTableId: tableId
                    }
                }
            });
        }
    }

    if (!tableId) {
        throw new Error('No PokerNow table ID found and could not be extracted from URL');
    }

    // 3. Automatically fetch and verify results
    console.log(`Verifying tournament ${tournamentId} (table: ${tableId})...`);
    const result = await pokerVerifier.verifyTournament(tableId);

    if (!result.verified) {
        throw new Error(`Verification failed: ${result.verificationError}`);
    }

    console.log(`Verified! Winner: ${result.winner}, Total hands: ${result.totalHands}`);

    // 4. Update tournament with verified results
    await prisma.tournament.update({
        where: { id: tournamentId },
        data: {
            winnerId: result.winner, // Map to your user ID
            status: 'COMPLETED',
            metadata: {
                ...(tournament as any).metadata,
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
        // Find the winning outcome
        const winningOutcome = market.outcomes.find(
            o => o.label === result.winner // || o.name === result.winner
        );

        if (!winningOutcome) {
            console.warn(`No outcome found for winner ${result.winner} in market ${market.id}`);
            continue;
        }

        try {
            // Use the centralized settlement logic
            const settlementResult = await settleMarket(market.id, winningOutcome.id);
            console.log(`Market ${market.id} settled. Winner: ${winningOutcome.label}. Payouts: ${settlementResult.totalPaidOut}`);
        } catch (error) {
            console.error(`Failed to settle market ${market.id}:`, error);
        }
    }

    return result;
}

/**
 * Example API route: POST /api/tournaments/[id]/verify
 */
export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const result = await settleTournamentBets(params.id);

        return Response.json({
            success: true,
            result,
        });
    } catch (error) {
        return Response.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
