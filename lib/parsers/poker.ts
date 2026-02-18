/**
 * PokerNow Log Parser
 * Parses hand history from PokerNow's /log_v3 API endpoint
 */

export interface PokerLogEntry {
    createdAt: number;
    msg: string;
}

export interface PlayerAction {
    player: string;
    action: 'fold' | 'check' | 'call' | 'raise' | 'bet' | 'ante' | 'blind';
    amount?: number;
    timestamp: number;
}

export interface PokerHand {
    handId: string;
    handNumber: number;
    gameType: string;
    dealer: string;
    players: Map<string, number>; // player -> starting stack
    actions: PlayerAction[];
    communityCards: {
        flop?: string[];
        turn?: string;
        river?: string;
    };
    winner?: {
        player: string;
        amount: number;
        hand?: string;
        cards?: string[];
    };
    pot: number;
}

export interface GameSummary {
    totalHands: number;
    hands: PokerHand[];
    playerStats: Map<string, {
        handsPlayed: number;
        handsWon: number;
        totalWinnings: number;
        totalLosses: number;
    }>;
}

/**
 * Parse a single hand from PokerNow log_v3 format
 */
export function parsePokerHand(logEntries: PokerLogEntry[]): PokerHand | null {
    if (!logEntries || logEntries.length === 0) return null;

    // Reverse to chronological order (API returns newest first)
    const entries = [...logEntries].reverse();

    const hand: Partial<PokerHand> = {
        actions: [],
        communityCards: {},
        players: new Map(),
        pot: 0,
    };

    for (const entry of entries) {
        const msg = entry.msg;

        // Starting hand
        const startMatch = msg.match(/-- starting hand #(\d+) \(id: (\w+)\)\s+(.+?)\s+\(dealer: "(.+?)"\)/);
        if (startMatch) {
            hand.handNumber = parseInt(startMatch[1]);
            hand.handId = startMatch[2];
            hand.gameType = startMatch[3];
            hand.dealer = startMatch[4];
            continue;
        }

        // Player stacks
        const stackMatch = msg.match(/Player stacks: (.+)/);
        if (stackMatch) {
            const stackPairs = stackMatch[1].split(' | ');
            for (const pair of stackPairs) {
                const playerMatch = pair.match(/#\d+ "(.+?)" \((\d+)\)/);
                if (playerMatch) {
                    hand.players!.set(playerMatch[1], parseInt(playerMatch[2]));
                }
            }
            continue;
        }

        // Actions: ante, blind, fold, check, call, raise
        const anteMatch = msg.match(/"(.+?)" posts an ante of (\d+)/);
        if (anteMatch) {
            hand.actions!.push({
                player: anteMatch[1],
                action: 'ante',
                amount: parseInt(anteMatch[2]),
                timestamp: entry.createdAt,
            });
            continue;
        }

        const blindMatch = msg.match(/"(.+?)" posts a (small|big) blind of (\d+)/);
        if (blindMatch) {
            hand.actions!.push({
                player: blindMatch[1],
                action: 'blind',
                amount: parseInt(blindMatch[3]),
                timestamp: entry.createdAt,
            });
            continue;
        }

        const foldMatch = msg.match(/"(.+?)" folds/);
        if (foldMatch) {
            hand.actions!.push({
                player: foldMatch[1],
                action: 'fold',
                timestamp: entry.createdAt,
            });
            continue;
        }

        const checkMatch = msg.match(/"(.+?)" checks/);
        if (checkMatch) {
            hand.actions!.push({
                player: checkMatch[1],
                action: 'check',
                timestamp: entry.createdAt,
            });
            continue;
        }

        const callMatch = msg.match(/"(.+?)" calls (\d+)/);
        if (callMatch) {
            hand.actions!.push({
                player: callMatch[1],
                action: 'call',
                amount: parseInt(callMatch[2]),
                timestamp: entry.createdAt,
            });
            continue;
        }

        const raiseMatch = msg.match(/"(.+?)" raises to (\d+)/);
        if (raiseMatch) {
            hand.actions!.push({
                player: raiseMatch[1],
                action: 'raise',
                amount: parseInt(raiseMatch[2]),
                timestamp: entry.createdAt,
            });
            continue;
        }

        // Community cards
        const flopMatch = msg.match(/Flop:\s+\[(.+?)\]/);
        if (flopMatch) {
            hand.communityCards!.flop = flopMatch[1].split(', ');
            continue;
        }

        const turnMatch = msg.match(/Turn: .+ \[(.+?)\]/);
        if (turnMatch) {
            hand.communityCards!.turn = turnMatch[1];
            continue;
        }

        const riverMatch = msg.match(/River: .+ \[(.+?)\]/);
        if (riverMatch) {
            hand.communityCards!.river = riverMatch[1];
            continue;
        }

        // Winner
        const winMatch = msg.match(/"(.+?)" collected (\d+) from pot(?:\s+with (.+?) \(combination: (.+?)\))?/);
        if (winMatch) {
            hand.winner = {
                player: winMatch[1],
                amount: parseInt(winMatch[2]),
                hand: winMatch[3],
                cards: winMatch[4]?.split(', '),
            };
            hand.pot = parseInt(winMatch[2]);
            continue;
        }
    }

    return hand as PokerHand;
}

/**
 * Parse multiple hands and generate game summary
 */
export function parsePokerLog(hands: PokerLogEntry[][]): GameSummary {
    const parsedHands: PokerHand[] = [];
    const playerStats = new Map<string, {
        handsPlayed: number;
        handsWon: number;
        totalWinnings: number;
        totalLosses: number;
    }>();

    for (const handLog of hands) {
        const hand = parsePokerHand(handLog);
        if (hand) {
            parsedHands.push(hand);

            // Update player stats
            for (const [player] of hand.players) {
                if (!playerStats.has(player)) {
                    playerStats.set(player, {
                        handsPlayed: 0,
                        handsWon: 0,
                        totalWinnings: 0,
                        totalLosses: 0,
                    });
                }
                const stats = playerStats.get(player)!;
                stats.handsPlayed++;

                if (hand.winner?.player === player) {
                    stats.handsWon++;
                    stats.totalWinnings += hand.winner.amount;
                }
            }
        }
    }

    return {
        totalHands: parsedHands.length,
        hands: parsedHands,
        playerStats,
    };
}
