/**
 * Poker Log Research & Development Scratchpad
 * 
 * Test the PokerNow log parser with real data
 * Run: npx tsx scripts/poker-log-research.ts
 */

import { parsePokerHand, parsePokerLog, type PokerLogEntry } from '../lib/parsers/poker';

// Sample hand from PokerNow API (Hand #23)
const SAMPLE_HAND_23: PokerLogEntry[] = [
    { "createdAt": 177099924234002, "msg": "-- ending hand #23 --" },
    { "createdAt": 177099924234001, "msg": "\"kozakmazal @ tNmm9y3O_m\" collected 625 from pot with Pair, A's (combination: 5♥, 6♥, J♦, A♦, A♥)" },
    { "createdAt": 177099924234000, "msg": "\"kozakmazal @ tNmm9y3O_m\" shows a 5♥, J♦." },
    { "createdAt": 177099924138200, "msg": "\"juri23 @ zhbPI5tFl8\" checks" },
    { "createdAt": 177099923944800, "msg": "\"kozakmazal @ tNmm9y3O_m\" checks" },
    { "createdAt": 177099923726900, "msg": "River: A♦, 6♥, 3♥, A♥ [2♣]" },
    { "createdAt": 177099923642600, "msg": "\"juri23 @ zhbPI5tFl8\" checks" },
    { "createdAt": 177099923495900, "msg": "\"kozakmazal @ tNmm9y3O_m\" checks" },
    { "createdAt": 177099923322100, "msg": "Turn: A♦, 6♥, 3♥ [A♥]" },
    { "createdAt": 177099923239300, "msg": "\"juri23 @ zhbPI5tFl8\" checks" },
    { "createdAt": 177099923024100, "msg": "\"kozakmazal @ tNmm9y3O_m\" checks" },
    { "createdAt": 177099922761800, "msg": "Flop:  [A♦, 6♥, 3♥]" },
    { "createdAt": 177099922678900, "msg": "\"juri23 @ zhbPI5tFl8\" checks" },
    { "createdAt": 177099922403500, "msg": "\"kozakmazal @ tNmm9y3O_m\" calls 250" },
    { "createdAt": 177099922028200, "msg": "\"po1ymorph @ A3hDjn8Uu2\" folds" },
    { "createdAt": 177099921945900, "msg": "\"Doink888 @ 3O_lI4huiB\" folds" },
    { "createdAt": 177099921864500, "msg": "\"Passengerrrr @ 5nHfoHh83V\" folds" },
    { "createdAt": 177099921649713, "msg": "\"juri23 @ zhbPI5tFl8\" posts a big blind of 250" },
    { "createdAt": 177099921649712, "msg": "\"kozakmazal @ tNmm9y3O_m\" posts a small blind of 125" },
    { "createdAt": 177099921649711, "msg": "\"Doink888 @ 3O_lI4huiB\" posts an ante of 25" },
    { "createdAt": 177099921649710, "msg": "\"Passengerrrr @ 5nHfoHh83V\" posts an ante of 25" },
    { "createdAt": 177099921649709, "msg": "\"juri23 @ zhbPI5tFl8\" posts an ante of 25" },
    { "createdAt": 177099921649708, "msg": "\"kozakmazal @ tNmm9y3O_m\" posts an ante of 25" },
    { "createdAt": 177099921649707, "msg": "\"po1ymorph @ A3hDjn8Uu2\" posts an ante of 25" },
    { "createdAt": 177099921649701, "msg": "Player stacks: #1 \"po1ymorph @ A3hDjn8Uu2\" (1610) | #2 \"kozakmazal @ tNmm9y3O_m\" (3222) | #3 \"juri23 @ zhbPI5tFl8\" (8448) | #4 \"Passengerrrr @ 5nHfoHh83V\" (3035) | #6 \"Doink888 @ 3O_lI4huiB\" (1685)" },
    { "createdAt": 177099921649700, "msg": "-- starting hand #23 (id: duvyfshfyrkf)  No Limit Texas Hold'em (dealer: \"po1ymorph @ A3hDjn8Uu2\") --" }
];

console.log("=== Testing PokerNow Log Parser ===\n");

// Test single hand parsing
const parsedHand = parsePokerHand(SAMPLE_HAND_23);
console.log("Parsed Hand #23:");
console.log(JSON.stringify(parsedHand, (key, value) =>
    value instanceof Map ? Object.fromEntries(value) : value
    , 2));

console.log("\n=== Hand Summary ===");
console.log(`Hand ID: ${parsedHand?.handId}`);
console.log(`Hand Number: ${parsedHand?.handNumber}`);
console.log(`Game Type: ${parsedHand?.gameType}`);
console.log(`Dealer: ${parsedHand?.dealer}`);
console.log(`Players: ${parsedHand?.players.size}`);
console.log(`Actions: ${parsedHand?.actions.length}`);
console.log(`Community Cards:`, parsedHand?.communityCards);
console.log(`Winner: ${parsedHand?.winner?.player} won ${parsedHand?.winner?.amount} with ${parsedHand?.winner?.hand}`);

// Test multi-hand parsing
console.log("\n=== Testing Multi-Hand Summary ===");
const summary = parsePokerLog([SAMPLE_HAND_23]);
console.log(`Total Hands: ${summary.totalHands}`);
console.log(`Player Stats:`, Object.fromEntries(summary.playerStats));
