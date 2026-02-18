/**
 * Quick analysis of PokerNow API responses
 * Run: npx tsx scripts/analyze-pokernow-data.ts
 */

// Sample data from the fetch commands you provided

const AUDIT_LOG_RESPONSE = {
    "pagesQuantity": 1,
    "page": 1,
    "data": [
        {
            "id": "30281695",
            "content": "The tournament has been created.",
            "createdAt": "2026-02-16T16:38:26.753Z"
        },
        {
            "id": "30281961",
            "content": "The player \"CryptoCat.xch\" requested the participation.",
            "createdAt": "2026-02-16T17:06:33.310Z"
        },
        {
            "id": "30282314",
            "content": "The player \"Newb_Monster18\" won the tournament with 9000 chips.",
            "createdAt": "2026-02-16T17:47:53.148Z"
        }
    ]
};

const PLAYERS_RESPONSE = {
    "pagesQuantity": 1,
    "page": 1,
    "data": [
        {
            "id": "zd-l1gV9o5",
            "playerId": "dYyNoEKCbi",
            "currentGameId": null,
            "currentSeat": 2,
            "createdAt": "2026-02-16T17:37:06.929Z",
            "name": "STlAn6Nn44",
            "status": "finished",
            "position": 3,
            "stack": 0,
            "mTTCurrentGame": null
        },
        {
            "id": "Pgzq94_U1m",
            "playerId": "kl2ZyclAHm",
            "currentGameId": null,
            "currentSeat": 3,
            "createdAt": "2026-02-16T17:26:22.027Z",
            "name": "Newb_Monster18",
            "status": "finished",
            "position": 1,
            "stack": 0,
            "mTTCurrentGame": null
        }
    ]
};

console.log("=== AUDIT LOG ANALYSIS ===");
console.log("Structure: Tournament-level events");
console.log("Contains: Player joins, blinds, eliminations, winner");
console.log("Missing: Hand-by-hand details (cards, bets, actions)");
console.log("\nSample event:", AUDIT_LOG_RESPONSE.data[0]);

console.log("\n=== PLAYERS ANALYSIS ===");
console.log("Structure: Player roster and final standings");
console.log("Contains: Position, stack, status");
console.log("Missing: Hand history, action details");
console.log("\nSample player:", PLAYERS_RESPONSE.data[0]);

console.log("\n=== CONCLUSION ===");
console.log("These APIs provide TOURNAMENT-LEVEL data only.");
console.log("For HAND HISTORY (cards dealt, bets placed, pots won),");
console.log("we need the GAME LOG from the specific table.");
console.log("\nExpected endpoint pattern:");
console.log("  https://www.pokernow.com/games/[TABLE_ID]/log");
console.log("  Example: https://www.pokernow.com/games/pglfaXOkp2qioU-nyVC1za8Zc/log");
