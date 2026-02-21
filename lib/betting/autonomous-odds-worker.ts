/**
 * Autonomous Odds Worker — Phase 2
 * 
 * Periodically polls PokerNow for active autonomous tournaments.
 * Updates BettingMarket.lastSyncedHand and triggers OddsEngine.updateMarketWeights.
 * Uses DRE Compiler to detect game completion and propose winners.
 */

import { prisma } from '@/lib/prisma';
import { pokerVerifier } from '@/lib/poker-verifier';
import { settleTournamentBets } from '@/lib/tournaments';
import { updateMarketWeights } from './odds-engine';
import { dreCompiler } from './dre-compiler';
import { ResolutionStatus, MarketStatus } from '@prisma/client';

const POLL_INTERVAL_MS = 10000; // 10 seconds

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
                    },
                    include: {
                        outcomes: true
                    }
                }
            }
        });

        if (tournaments.length === 0) return;

        for (const tournament of tournaments) {
            await this.syncTournamentLogs(tournament as any);
        }
    }

    /**
     * Sync logs for a specific tournament and update odds
     */
    private async syncTournamentLogs(tournament: any) {
        const { id: tournamentId, bettingMarkets: markets } = tournament;
        const tableId = tournament.metadata?.tableId || tournament.tableId;

        if (!tableId) {
            // Silently skip if no tableId (might be early setup)
            return;
        }

        try {
            // 1. Find the latest hand on PokerNow
            // Wrap in safe check to prevent crashes if tournament hasn't actually started on PokerNow
            let latestHand = 0;
            try {
                latestHand = await pokerVerifier.findLastHand(tableId);
            } catch (e) {
                // Table doesn't exist yet or PokerNow API returned error
                return;
            }

            if (latestHand <= 0) {
                // Check for "Zombie" tournament (0 hands for > 4 hours after start)
                const startTime = new Date(tournament.startDate);
                const hoursSinceStart = (Date.now() - startTime.getTime()) / (1000 * 60 * 60);

                if (hoursSinceStart > 4) {
                    console.log(`[Zombie-Check] Tournament ${tournamentId} has 0 hands after 4 hours. Auto-completing.`);
                    await prisma.tournament.update({
                        where: { id: tournamentId },
                        data: { status: 'COMPLETED' }
                    });
                }
                return;
            }

            // 2. Determine the lowest lastSyncedHand among all markets
            const minSyncedHand = Math.min(...markets.map((m: any) => m.lastSyncedHand || 0));

            if (latestHand <= minSyncedHand) {
                return;
            }

            console.log(`Tournament ${tournamentId}: Found new hands (Current: ${latestHand}, Synced: ${minSyncedHand})`);

            // 3. Update Sync Progress
            await prisma.bettingMarket.updateMany({
                where: {
                    id: { in: markets.map((m: any) => m.id) }
                },
                data: {
                    lastSyncedHand: latestHand
                }
            });

            // 4. Trigger Odds Recalculation (Parimutuel)
            for (const market of markets) {
                await updateMarketWeights(market.id);
            }

            // 5. Phase 2 & 3: DRE Analysis (Check for Winner OR Anti-Sniping Pause)
            const result = await dreCompiler.compileGameResult(tableId, latestHand);

            // AUTO-PAUSE (Anti-Sniping)
            if (result.isPaused) {
                console.log(`[DRE] High Volatility Detected (All-In). Pausing markets for Tournament ${tournamentId}`);
                await prisma.bettingMarket.updateMany({
                    where: {
                        id: { in: markets.map((m: any) => m.id) },
                        status: 'OPEN'
                    },
                    data: {
                        isPaused: true,
                        suspensionReason: result.reasoning || "High Volatility Event"
                    }
                });
                return;
            }

            if (result.status === 'COMPLETED' && result.winner) {
                console.log(`[DRE] Game Completed for Tournament ${tournamentId}. Winner: ${result.winner}`);

                // Fetch final game standings to persist rankings
                console.log(`[DRE] Triggering 100% automated settlement for ${tournamentId}...`);
                try {
                    await settleTournamentBets(tournamentId);
                    console.log(`[DRE] Tournament ${tournamentId} successfully auto-settled, rankings saved, and bets paid out.`);
                } catch (e) {
                    console.error(`[DRE] Automated settlement failed for ${tournamentId}`, e);
                }
            }

        } catch (error) {
            console.error(`Failed to sync tournament ${tournamentId}:`, error);
        }
    }
}

// Export singleton
export const autonomousOddsWorker = new AutonomousOddsWorker();
