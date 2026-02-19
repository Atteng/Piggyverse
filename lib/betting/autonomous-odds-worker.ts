/**
 * Autonomous Odds Worker — Phase 2
 * 
 * Periodically polls PokerNow for active autonomous tournaments.
 * Updates BettingMarket.lastSyncedHand and triggers OddsEngine.updateMarketWeights.
 * Uses DRE Compiler to detect game completion and propose winners.
 */

import { prisma } from '@/lib/prisma';
import { pokerVerifier } from '@/lib/poker-verifier';
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

        console.log(`Processing ${tournaments.length} active autonomous tournaments...`);

        for (const tournament of tournaments) {
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

                // Pause all open markets for this tournament
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

                // Skip further processing this tick
                return;
            }

            if (result.status === 'COMPLETED' && result.winner) {
                console.log(`[DRE] Game Completed for Tournament ${tournamentId}. Winner: ${result.winner}`);

                // For each market, find the matching outcome
                for (const market of markets) {
                    // Simple string matching for now. 
                    const winningOutcome = market.outcomes.find((o: any) =>
                        o.label.toLowerCase() === result.winner!.toLowerCase()
                    );

                    if (winningOutcome) {
                        console.log(`[DRE] Proposing winner for market ${market.id}: ${winningOutcome.label} (${winningOutcome.id})`);

                        await prisma.bettingMarket.update({
                            where: { id: market.id },
                            data: {
                                status: MarketStatus.CLOSED, // Stop betting
                                resolutionStatus: ResolutionStatus.PROPOSED,
                                aiProposedWinnerId: winningOutcome.id,
                                resolverDSL: result.resolverDSL ?? result.reasoning ?? null,
                            }
                        });
                    } else {
                        console.warn(`[DRE] Winner "${result.winner}" not found in market ${market.id} outcomes.`);
                    }
                }
            }

            console.log(`Updated odds for ${markets.length} markets in Tournament ${tournamentId}`);

        } catch (error) {
            console.error(`Failed to sync tournament ${tournamentId}:`, error);
        }
    }
}

// Export singleton
export const autonomousOddsWorker = new AutonomousOddsWorker();
