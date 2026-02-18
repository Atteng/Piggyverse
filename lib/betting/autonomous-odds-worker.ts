/**
 * Autonomous Odds Worker — Phase 1
 * 
 * Periodically polls PokerNow for active autonomous tournaments.
 * Updates BettingMarket.lastSyncedHand and triggers OddsEngine.updateMarketWeights.
 * 
 * NOTE: This is designed to run as a background job or a scheduled task (e.g., cron or simple interval in dev).
 */

import { prisma } from '@/lib/prisma';
import { pokerVerifier } from '@/lib/poker-verifier';
import { updateMarketWeights } from './odds-engine';

const POLL_INTERVAL_MS = 10000; // 10 seconds
const BATCH_SIZE = 10; // Max hands to process per cycle

export class AutonomousOddsWorker {
    private isRunning = false;
    private timer: NodeJS.Timeout | null = null;

    /**
     * Start the worker loop
     */
    public start() {
        if (this.isRunning) return;
        this.isRunning = true;
        console.log('Autonomous Odds Worker started...');
        this.loop();
    }

    /**
     * Stop the worker loop
     */
    public stop() {
        this.isRunning = false;
        if (this.timer) clearTimeout(this.timer);
        console.log('Autonomous Odds Worker stopped.');
    }

    private async loop() {
        if (!this.isRunning) return;

        try {
            await this.processActiveTournaments();
        } catch (error) {
            console.error('Error in odds worker loop:', error);
        }

        // Schedule next run
        this.timer = setTimeout(() => this.loop(), POLL_INTERVAL_MS);
    }

    /**
     * Find active tournaments with autonomous markets and sync logs
     */
    private async processActiveTournaments() {
        // Find ACTIVE tournaments that have at least one OPEN autonomous market
        const tournaments = await prisma.tournament.findMany({
            where: {
                status: 'ACTIVE',
                bettingMarkets: {
                    some: {
                        status: 'OPEN',
                        isAutonomous: true
                    }
                }
            },
            include: {
                bettingMarkets: {
                    where: {
                        status: 'OPEN',
                        isAutonomous: true
                    }
                }
            }
        });

        if (tournaments.length === 0) return;

        console.log(`Processing ${tournaments.length} active autonomous tournaments...`);

        for (const tournament of tournaments) {
            // Need to cast or adjust logic because Prisma types can be tricky with partial includes
            // The include above guarantees bettingMarkets exists and has the fields we need
            await this.syncTournamentLogs(
                tournament.id,
                (tournament as any).tableId,
                (tournament as any).bettingMarkets
            );
        }
    }

    /**
     * Sync logs for a specific tournament and update odds
     */
    private async syncTournamentLogs(tournamentId: string, tableId: string, markets: any[]) {
        try {
            // 1. Find the latest hand on PokerNow
            const latestHand = await pokerVerifier.findLastHand(tableId);

            // 2. Determine the lowest lastSyncedHand among all markets
            // We process from the oldest sync point to ensure no gaps
            const minSyncedHand = Math.min(...markets.map((m: any) => m.lastSyncedHand || 0));

            if (latestHand <= minSyncedHand) {
                // No new hands
                return;
            }

            console.log(`Tournament ${tournamentId}: Found new hands (Current: ${latestHand}, Synced: ${minSyncedHand})`);

            // 3. Process new hands (just updating the counter for now, logic triggers on hand completion)
            // In Phase 2, we would feed these logs to the AI/Compiler.
            // In Phase 1, we simply acknowledge that "time has passed" and odds might need re-checking if correlated to hand count.

            // However, Parimutuel odds change based on *Bets*, not strictly *Hands*.
            // But we update the 'lastSyncedHand' to track game progress for the UI.

            // For Phase 1, we just update the markets to the latest hand
            await prisma.bettingMarket.updateMany({
                where: {
                    id: { in: markets.map((m: any) => m.id) }
                },
                data: {
                    lastSyncedHand: latestHand
                }
            });

            // 4. Trigger Odds Recalculation (Parimutuel)
            // Even though parimutuel odds update on bets, we trigger a recalc here to ensure consistency
            // and to handle any future logic that depends on game state.
            for (const market of markets) {
                await updateMarketWeights(market.id);
            }

            console.log(`Updated odds for ${markets.length} markets in Tournament ${tournamentId}`);

        } catch (error) {
            console.error(`Failed to sync tournament ${tournamentId}:`, error);
        }
    }
}

// Export singleton
export const autonomousOddsWorker = new AutonomousOddsWorker();
