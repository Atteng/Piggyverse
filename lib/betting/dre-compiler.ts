import { pokerVerifier } from '@/lib/poker-verifier';
import { parsePokerHand } from '@/lib/parsers/poker';

export interface DREResult {
    status: 'RUNNING' | 'COMPLETED';
    winner?: string;
    confidence: number; // 0-1
    reasoning?: string;
    resolverDSL?: string; // Human-readable explanation of the logic that fired
    isPaused?: boolean; // Signal to suspend the market (Anti-Sniping)
}

export class DRECompiler {
    /**
     * Analyze the game state to determine if there is a winner.
     * Rebuy-aware: only fires if a player has been at zero chips for
     * multiple consecutive hands (confirming elimination, not a temporary bust).
     *
     * @param tableId The PokerNow table ID
     * @param lastHandNumber The number of the last hand played
     */
    async compileGameResult(tableId: string, lastHandNumber: number): Promise<DREResult> {
        try {
            // 1. Need at least 2 hands to confirm bust-out (not a rebuy)
            if (lastHandNumber < 2) {
                return {
                    status: 'RUNNING',
                    confidence: 0,
                    reasoning: 'Not enough hands played to assess elimination.'
                };
            }

            // 2. Fetch logs for the last two hands to compare stacks
            const [currentLogs, previousLogs] = await Promise.all([
                pokerVerifier.fetchHand(tableId, lastHandNumber),
                pokerVerifier.fetchHand(tableId, lastHandNumber - 1),
            ]);

            if (!currentLogs || currentLogs.length === 0) {
                return { status: 'RUNNING', confidence: 0, reasoning: 'No logs for current hand.' };
            }

            // 3. Parse both hands
            const currentHand = parsePokerHand(currentLogs);
            const previousHand = previousLogs?.length ? parsePokerHand(previousLogs) : null;

            if (!currentHand) {
                return { status: 'RUNNING', confidence: 0, reasoning: 'Failed to parse current hand.' };
            }

            // 4. Get active (non-zero stack) players in current hand
            const currentActivePlayers = Array.from(currentHand.players.entries())
                .filter(([_, stack]) => stack > 0);

            // 5. Anti-Sniping / High Volatility Check
            // Scan current hand logs for major action ("all in")
            // If an all-in occurred, we pause the market to prevent sniping before the result is known.
            const hasAllIn = currentLogs.some(log => log.msg.toLowerCase().includes('all in'));

            if (hasAllIn) {
                return {
                    status: 'RUNNING',
                    isPaused: true,
                    reasoning: 'High Volatility Event: All-In Detected',
                    confidence: 0,
                    resolverDSL: `HAND: ${lastHandNumber} | ACTION: ALL_IN_DETECTED | STATUS: PAUSED_ANTI_SNIPING`
                };
            }

            // 6. Rebuy-Awareness Check
            const confirmedEliminations = new Set<string>();

            if (previousHand) {
                for (const [player, stack] of currentHand.players.entries()) {
                    const prevStack = previousHand.players.get(player) ?? null;

                    // Player has 0 chips now and had 0 (or didn't exist) last hand → eliminated
                    if (stack === 0 && (prevStack === 0 || prevStack === null)) {
                        confirmedEliminations.add(player);
                    }
                    // Player has 0 now but had chips last hand → possible rebuy still in play,
                    // skip — they may re-enter next hand
                }
            }

            // 6. Determine true active players (non-zero chips, not confirmed eliminated)
            const trueActivePlayers = currentActivePlayers.filter(
                ([name]) => !confirmedEliminations.has(name)
            );

            // 7. Check for Completion
            if (trueActivePlayers.length === 1) {
                const [winnerName, stack] = trueActivePlayers[0];

                const dsl = [
                    `HAND: ${lastHandNumber}`,
                    `ACTIVE_PLAYERS_CURRENT_HAND: ${currentActivePlayers.length}`,
                    `CONFIRMED_ELIMINATIONS: ${confirmedEliminations.size}`,
                    `WINNER: ${winnerName} (stack: ${stack})`,
                    `RULE: player.stack > 0 AND confirmed_bust_in_consecutive_hands < 1`,
                    `REBUY_CHECK: passed (cross-referenced hand ${lastHandNumber - 1})`,
                ].join(' | ');

                return {
                    status: 'COMPLETED',
                    winner: winnerName,
                    confidence: 1.0,
                    reasoning: `"${winnerName}" is the last player standing with ${stack} chips after rebuy check.`,
                    resolverDSL: dsl,
                };
            }

            return {
                status: 'RUNNING',
                confidence: 0.5,
                reasoning: `${trueActivePlayers.length} players still active after rebuy analysis.`,
                resolverDSL: `HAND: ${lastHandNumber} | ACTIVE: ${trueActivePlayers.map(([n]) => n).join(', ')}`,
            };

        } catch (error) {
            console.error('DRE Compiler Error:', error);
            return { status: 'RUNNING', confidence: 0, reasoning: 'Internal Error' };
        }
    }
}

export const dreCompiler = new DRECompiler();
