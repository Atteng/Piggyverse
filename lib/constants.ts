/**
 * PiggyVerse Application Constants
 * Single source of truth for static configurations.
 */

export const TOURNAMENT_TEMPLATES = [
    {
        id: "league",
        name: "League",
        description: "All players compete simultaneously; rankings determine outcomes.",
        minPlayers: 2,
        maxPlayers: 100
    },
    {
        id: "battle_royale",
        name: "Battle Royale",
        description: "A Free For All format where players are eliminated until one remains.",
        minPlayers: 10,
        maxPlayers: 100
    }
];

export const GAME_MODES = {
    "1": ["Texas Hold'em", "Omaha", "Short Deck"], // Piggy Poker
    "2": ["Classic", "Progressive", "Tournament Mode"], // Cyber Slots
    "3": ["Time Trial", "Grand Prix", "Elimination"], // Neon Racer
    "4": ["Deathmatch", "Capture the Flag", "King of the Hill"], // Space Rebels
    "5": ["Dungeon Run", "Boss Rush", "PvP Arena"], // Crypto Quest
    "6": ["Endless", "Level Rush", "Puzzle Mode"] // Block Breaker
};

export const TOKENS = [
    { symbol: "PIGGY", name: "Piggy Token", icon: "🐷" },
    { symbol: "UP", name: "UP Token", icon: "⬆️" },
    { symbol: "USDC", name: "USD Coin", icon: "💲" },
    { symbol: "TUSDC", name: "Test USDC", icon: "🧪" }
];
