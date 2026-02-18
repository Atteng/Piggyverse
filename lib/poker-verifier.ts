/**
 * PokerNow Tournament Verification Service
 * Automatically fetches and verifies tournament results for betting settlement
 */

import { parsePokerHand, parsePokerLog, type PokerLogEntry } from './parsers/poker';

interface PokerNowConfig {
    apiBaseUrl: string;
    credentials?: {
        cookie?: string; // If authentication is required
    };
}

interface TournamentResult {
    tableId: string;
    totalHands: number;
    winner: string;
    finalStandings: Array<{
        player: string;
        position: number;
        finalStack: number;
    }>;
    playerStats: Map<string, {
        handsPlayed: number;
        handsWon: number;
        totalWinnings: number;
    }>;
    verified: boolean;
    verificationError?: string;
}

export class PokerNowVerifier {
    private config: PokerNowConfig;

    constructor(config?: Partial<PokerNowConfig>) {
        this.config = {
            apiBaseUrl: 'https://www.pokernow.com/api',
            ...config,
        };
    }

    /**
     * Find the last hand number for a table using binary search
     * Publicly exposed for autonomous worker polling
     */
    public async findLastHand(tableId: string): Promise<number> {
        let low = 1;
        let high = 5000; // Increased limit for larger tournaments
        let lastValid = 1;

        while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            // Use log_v3 endpoint which is lighter
            const url = `${this.config.apiBaseUrl}/games/${tableId}/log_v3?hand_number=${mid}`;

            try {
                const response = await fetch(url, {
                    credentials: 'include',
                    headers: this.config.credentials?.cookie
                        ? { 'Cookie': this.config.credentials.cookie }
                        : {},
                });

                if (response.ok) {
                    lastValid = mid;
                    low = mid + 1;
                } else {
                    high = mid - 1;
                }
            } catch (error) {
                high = mid - 1; // Assume network error means hand doesn't exist to be safe
                // In production, we should retry or handle specific errors differently
            }
        }

        return lastValid;
    }

    /**
     * Fetch a single hand from PokerNow API
     * Publicly exposed
     */
    public async fetchHand(tableId: string, handNumber: number): Promise<PokerLogEntry[] | null> {
        const url = `${this.config.apiBaseUrl}/games/${tableId}/log_v3?hand_number=${handNumber}`;

        try {
            const response = await fetch(url, {
                credentials: 'include',
                headers: {
                    'accept': 'application/json, text/plain, */*',
                    ...(this.config.credentials?.cookie
                        ? { 'Cookie': this.config.credentials.cookie }
                        : {}),
                },
            });

            if (!response.ok) return null;
            return await response.json();
        } catch (error) {
            console.error(`Failed to fetch hand ${handNumber}:`, error);
            return null;
        }
    }

    /**
     * Fetch a range of hands
     * Optimized for batch processing in workers
     */
    public async fetchHandRange(tableId: string, startHand: number, endHand: number): Promise<PokerLogEntry[][]> {
        const batchSize = 10;
        const hands: PokerLogEntry[][] = [];

        for (let i = startHand; i <= endHand; i += batchSize) {
            const currentBatchEnd = Math.min(i + batchSize - 1, endHand);
            const batch = await Promise.all(
                Array.from({ length: currentBatchEnd - i + 1 }, (_, j) =>
                    this.fetchHand(tableId, i + j)
                )
            );
            hands.push(...batch.filter((h): h is PokerLogEntry[] => h !== null));

            // Rate limiting delay
            if (i + batchSize <= endHand) {
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }
        return hands;
    }

    /**
     * Fetch all hands from a tournament table
     */
    private async fetchAllHands(tableId: string): Promise<PokerLogEntry[][]> {
        console.log(`Finding last hand for table ${tableId}...`);
        const lastHand = await this.findLastHand(tableId);
        console.log(`Found ${lastHand} hands. Fetching all...`);

        const hands: PokerLogEntry[][] = [];
        const batchSize = 5; // Fetch 5 hands at a time to avoid rate limiting

        for (let i = 1; i <= lastHand; i += batchSize) {
            const batch = await Promise.all(
                Array.from({ length: Math.min(batchSize, lastHand - i + 1) }, (_, j) =>
                    this.fetchHand(tableId, i + j)
                )
            );

            hands.push(...batch.filter((h): h is PokerLogEntry[] => h !== null));

            // Small delay to be respectful to the API
            if (i + batchSize <= lastHand) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        return hands;
    }

    /**
     * Verify tournament results by fetching and parsing all hands
     */
    async verifyTournament(tableId: string): Promise<TournamentResult> {
        try {
            // Fetch all hands
            const allHands = await this.fetchAllHands(tableId);

            if (allHands.length === 0) {
                return {
                    tableId,
                    totalHands: 0,
                    winner: '',
                    finalStandings: [],
                    playerStats: new Map(),
                    verified: false,
                    verificationError: 'No hands found for this table',
                };
            }

            // Parse all hands
            const summary = parsePokerLog(allHands);

            // Get final standings from the last hand
            const lastHand = parsePokerHand(allHands[allHands.length - 1]);
            const finalStandings = lastHand
                ? Array.from(lastHand.players.entries())
                    .map(([player, stack]) => ({ player, stack }))
                    .sort((a, b) => b.stack - a.stack)
                    .map((p, i) => ({
                        player: p.player,
                        position: i + 1,
                        finalStack: p.stack,
                    }))
                : [];

            const winner = finalStandings[0]?.player || '';

            return {
                tableId,
                totalHands: summary.totalHands,
                winner,
                finalStandings,
                playerStats: summary.playerStats,
                verified: true,
            };
        } catch (error) {
            console.error('Tournament verification failed:', error);
            return {
                tableId,
                totalHands: 0,
                winner: '',
                finalStandings: [],
                playerStats: new Map(),
                verified: false,
                verificationError: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Verify multiple tables from a multi-table tournament
     */
    async verifyMultiTableTournament(tableIds: string[]): Promise<TournamentResult[]> {
        return Promise.all(tableIds.map(id => this.verifyTournament(id)));
    }
}

// Export singleton instance
export const pokerVerifier = new PokerNowVerifier();
