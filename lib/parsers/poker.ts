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

/**
 * Parse a full CSV log from PokerNow's /log.csv endpoint
 */
export function parsePokerCSVLog(csvText: string): GameSummary {
    if (!csvText) return { totalHands: 0, hands: [], playerStats: new Map() };

    // The CSV has headers: "entry_at","msg","net_amount"
    // We only care about the chronological sequence of messages.
    // Usually PokerNow CSVs have newest first or oldest first depending on download format,
    // but the standard download is oldest first or newest first. We need to normalize.
    // The safest way is to split by newline, extract the message, and then let our existing logic handle it.

    // Split by newlines (handling both \r\n and \n)
    const lines = csvText.trim().split(/\r?\n/);

    // Remove the header row if it exists
    if (lines[0].toLowerCase().includes('entry_at')) {
        lines.shift();
    }

    const logEntries: PokerLogEntry[] = [];

    // CSV parser regex to handle quoted messages correctly
    // Match: "date","message",net_amount OR date,"message",net_amount
    const csvRegex = /^(?:")?(.*?)(?:")?,(?:")?(.*?)(?:")?,(?:")?(.*?)(?:")?$/;

    // We need to group lines by hand. A new hand starts with "-- starting hand"
    // Since we don't know the sort order of the file, we will extract all entries,
    // and then chunk them by hand.
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];

        // Handle multi-line CSV rows (if any) or simple splitting
        // For simplicity and speed, we can just look for the message content
        // since our Regex parser in `parsePokerHand` only reads the 'msg' string.

        // A simple way to extract the message is to find the middle block.
        // Or we can just run the regex engine directly against the raw line
        // if we strip out the date prefix and comma.

        // PokerNow CSV format: "2024-02-12T15:30:00.000Z", "The dealer is ...", "0"
        let msgStr = line;

        // Extract the actual message from the CSV row safely
        const parts = line.split(/,"|"?,/);
        if (parts.length >= 2) {
            // Usually the message is in the second or last column
            msgStr = parts.find(p => p.includes('dealer:') || p.includes('folds') || p.includes('calls') || p.includes('posts') || p.includes('collected') || p.includes('Player stacks:')) || line;

            // Clean quotes
            msgStr = msgStr.replace(/^"/, '').replace(/"$/, '').trim();
        }

        logEntries.push({
            createdAt: Date.now() - i, // Fake timestamp for ordering if needed
            msg: msgStr
        });
    }

    // Now we chunk the flat log array into individual hands
    // A hand starts with "-- starting hand" and ends when the next one begins.
    const hands: PokerLogEntry[][] = [];
    let currentHand: PokerLogEntry[] = [];

    // PokerNow logs read bottom-to-top (newest on top) or top-to-bottom.
    // Let's ensure chronological order: Start to finish
    // Check if the first entry is hand #1 or the last hand.
    const isReverseOrdered = logEntries[0]?.msg.includes('quits') || logEntries[0]?.msg.includes('collected'); // heuristic

    const orderedEntries = isReverseOrdered ? logEntries.reverse() : logEntries;

    for (const entry of orderedEntries) {
        if (entry.msg.includes('-- starting hand #')) {
            if (currentHand.length > 0) {
                // We need to reverse the individual hand array because `parsePokerHand` 
                // expects the API format where the hand's entries are newest-first (API style)
                // before it reverses them back.
                hands.push(currentHand.reverse());
            }
            currentHand = [entry];
        } else if (currentHand.length > 0) {
            currentHand.push(entry);
        }
    }

    // Push the final hand
    if (currentHand.length > 0) {
        hands.push(currentHand.reverse());
    }

    return parsePokerLog(hands);
}
