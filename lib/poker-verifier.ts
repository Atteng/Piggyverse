/**
 * PokerNow Tournament Verification Service
 * Automatically fetches and verifies tournament results for betting settlement
 */

import { parsePokerHand, parsePokerLog, parsePokerCSVLog, type PokerLogEntry } from './parsers/poker';

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
                } else if (response.status === 404 && mid === 1) {
                    // If even hand #1 returns 404, this might be an MTT or an invalid ID.
                    // We return 0 to signal no hands could be found via Game API.
                    return 0;
                } else {
                    high = mid - 1;
                }
            } catch (error) {
                high = mid - 1;
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
                // FALLBACK: If standard hand fetch fails, check if this is an MTT
                console.log(`[Verifier] No Game hands found for ${tableId}. Checking MTT audit log...`);
                const mttResult = await this.verifyTournamentMTT(tableId);
                if (mttResult.verified) return mttResult;

                return {
                    tableId,
                    totalHands: 0,
                    winner: '',
                    finalStandings: [],
                    playerStats: new Map(),
                    verified: false,
                    verificationError: 'No hands or MTT audit logs found for this table.',
                };
            }

            // Parse all hands
            const summary = parsePokerLog(allHands);

            // --- ELIMINATION TRACKER LOGIC ---
            // Track the exact hand number a player went bust
            const eliminationHands = new Map<string, number>();
            const activePlayers = new Set<string>();

            // Chronologically scan hands to track bust-outs
            const sortedHands = [...summary.hands].sort((a, b) => a.handNumber - b.handNumber);

            for (const hand of sortedHands) {
                for (const [player, stack] of hand.players.entries()) {
                    activePlayers.add(player); // Discover player
                    if (stack === 0) {
                        // Player busted in a previous hand and didn't rebuy
                        if (!eliminationHands.has(player)) {
                            eliminationHands.set(player, hand.handNumber);
                        }
                    } else {
                        // Player still has chips, or they rebought
                        if (eliminationHands.has(player)) {
                            eliminationHands.delete(player); // Cancel the bust-out
                        }
                    }
                }
            }

            // Find players who survived to the very end (last hand)
            const lastHand = sortedHands[sortedHands.length - 1];
            const survivors = Array.from(lastHand?.players.entries() || [])
                .filter(([_, stack]) => stack > 0)
                .sort((a, b) => b[1] - a[1]); // Sort survivors by final stack descending

            // Find eliminated players
            const eliminated = Array.from(eliminationHands.entries())
                .sort((a, b) => b[1] - a[1]); // Sort by hand number eliminated (highest hand = survived longer)

            // Construct exact final standings
            const finalStandings: Array<{ player: string, position: number, finalStack: number }> = [];
            let currentPosition = 1;

            // 1st: Add survivors
            for (const [player, lastStack] of survivors) {
                finalStandings.push({
                    player,
                    position: currentPosition++,
                    finalStack: lastStack
                });
            }

            // 2nd: Add eliminated players
            for (const [player, handBustedOut] of eliminated) {
                // If by some edge case they are in the survivor list, skip
                if (!finalStandings.find(s => s.player === player)) {
                    finalStandings.push({
                        player,
                        position: currentPosition++,
                        finalStack: 0 // Busted
                    });
                }
            }

            // Fallback for anyone missed (e.g. didn't appear in later logs)
            for (const player of Array.from(activePlayers)) {
                if (!finalStandings.find(s => s.player === player)) {
                    finalStandings.push({
                        player,
                        position: currentPosition++,
                        finalStack: 0
                    });
                }
            }

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
     * Verify a completed tournament instantly.
     * Automatically detect if the ID is a single table (Game) or an MTT and use the appropriate engine.
     */
    async verifyTournamentFullCSV(tableId: string): Promise<TournamentResult> {
        console.log(`[Full Sync] Probing PokerNow for table/MTT ${tableId}...`);

        // Try MTT Audit Log first if the ID looks like a string or if it's explicitly an MTT
        // Most MTT IDs in the logs provided show alphanumeric strings similar to games.
        const mttResult = await this.verifyTournamentMTT(tableId);
        if (mttResult.verified) {
            return mttResult;
        }

        // Fallback to traditional Game Log fetching
        console.log(`[Full Sync] MTT check failed or returned no data. Falling back to deep hand fetch...`);
        return this.verifyTournament(tableId);
    }

    /**
     * Verify an MTT (Multi-Table Tournament) using the audit log API.
     */
    async verifyTournamentMTT(mttId: string): Promise<TournamentResult> {
        try {
            console.log(`[MTT Sync] Fetching audit log for MTT ${mttId}...`);
            let allEntries: any[] = [];

            // PokerNow API for MTT audit logs is at 'https://www.pokernow.com/api/mtt/[ID]/audit-log'
            const apiBase = this.config.apiBaseUrl.includes('/api') ? this.config.apiBaseUrl : `${this.config.apiBaseUrl}/api`;
            const mttUrl = `${apiBase}/mtt/${mttId}/audit-log`;

            // Fetch the first page to get total pages
            const firstPageResponse = await fetch(mttUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'accept': 'application/json, text/plain, */*'
                },
                body: JSON.stringify({ page: 1 })
            });

            if (!firstPageResponse.ok) {
                if (firstPageResponse.status === 404) {
                    throw new Error('MTT not found (404)');
                }
                throw new Error(`Audit log fetch failed: ${firstPageResponse.statusText}`);
            }

            const firstPageData = await firstPageResponse.json();
            if (!firstPageData.data || !Array.isArray(firstPageData.data)) {
                throw new Error('Invalid audit log data format received.');
            }

            allEntries = [...firstPageData.data];
            const totalPages = firstPageData.pagesQuantity || 1;

            // Fetch remaining pages
            for (let p = 2; p <= totalPages; p++) {
                const res = await fetch(mttUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ page: p })
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.data) allEntries = [...allEntries, ...data.data];
                }
            }

            // Derived Rankings logic
            const eliminatedPlayers: string[] = []; // Chronological (first out = index 0)
            let winner = '';

            // Audit log entries are typically chronological (oldest first in the array)
            for (const entry of allEntries) {
                const content = entry.content || '';

                // Match eliminations: "The player \"Name\" left the tournament with the stack 0 chips."
                const eliminationMatch = content.match(/The player "(.+?)" left the tournament with the stack 0 chips/i);
                if (eliminationMatch) {
                    const name = eliminationMatch[1];
                    // If a player rebuys, they might "leave with 0" multiple times conceptually in some logs, 
                    // but usually in MTTs once you're out of chips and don't rebuy immediately you're out.
                    // We remove them if they re-appear later as winners or survivors? 
                    // Actually, the log order is absolute. The LAST time they appear as "left with 0" is their final rank.
                    // So we filter duplicates and keep the LATEST one.
                    const existingIndex = eliminatedPlayers.indexOf(name);
                    if (existingIndex !== -1) {
                        eliminatedPlayers.splice(existingIndex, 1);
                    }
                    eliminatedPlayers.push(name);
                }

                // Match winner: "The player \"Name\" won the tournament with X chips."
                const winnerMatch = content.match(/The player "(.+?)" won the tournament with (\d+) chips/i);
                if (winnerMatch) {
                    winner = winnerMatch[1];
                }
            }

            if (!winner && eliminatedPlayers.length === 0) {
                return {
                    tableId: mttId,
                    totalHands: 0,
                    winner: '',
                    finalStandings: [],
                    playerStats: new Map(),
                    verified: false,
                    verificationError: 'Audit log contains no elimination or victory records.'
                };
            }

            const finalStandings: Array<{ player: string, position: number, finalStack: number }> = [];

            // 1st place
            if (winner) {
                finalStandings.push({ player: winner, position: 1, finalStack: 0 });
            }

            // Places 2+ (Reversed chronological eliminations)
            const reversedEliminations = [...eliminatedPlayers].reverse();
            let currentPos = winner ? 2 : 1;
            for (const p of reversedEliminations) {
                if (p === winner) continue;
                finalStandings.push({ player: p, position: currentPos++, finalStack: 0 });
            }

            return {
                tableId: mttId,
                totalHands: 0,
                winner,
                finalStandings,
                playerStats: new Map(),
                verified: true
            };

        } catch (error) {
            console.error('[MTT Sync Error]:', error);
            return {
                tableId: mttId,
                totalHands: 0,
                winner: '',
                finalStandings: [],
                playerStats: new Map(),
                verified: false,
                verificationError: error instanceof Error ? error.message : 'Unknown MTT error'
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
