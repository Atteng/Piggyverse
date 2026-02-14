export const TOP_PLAYERS = [
    { username: "RevengeIP", rank: 1, avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80" },
    { username: "Holic", rank: 2, avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150&q=80" },
    { username: "Mary", rank: 3, avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&q=80" },
    { username: "AnneLinkA", rank: 4, avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&q=80" },
    { username: "pa3gBa", rank: 5, avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&q=80" },
    { username: "Nooxin", rank: 6, avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80" },
    { username: "Metil", rank: 7, avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&q=80" },
];

export const USER_STATS = {
    winRate: 56.2,
    hoursPlayed: 142,
    tournamentsWon: 3,
    tokensEarned: 1250
};

export const FEATURED_GAME = {
    title: "BOOH BRAWLERS",
    description: "The ultimate physics-based brawler where ghosts collide!",
    image: "https://images.unsplash.com/photo-1618193139062-2c5bf4f935b7?w=1600&q=80",
};

export const GAMES = [
    {
        id: "1",
        title: "Piggy Poker",
        thumbnail: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800&q=80",
        categories: ["Card", "Strategy"],
        playerCount: "12k",
        isLive: true,
        tournamentStatus: "Ongoing",
        prizePool: "10,000 $PIGGY",
        bettingAllowed: true
    },
    {
        id: "2",
        title: "Cyber Slots",
        thumbnail: "https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=800&q=80",
        categories: ["Casino", "Luck"],
        playerCount: "8.5k",
        isLive: false,
        tournamentStatus: "In 18:00",
        prizePool: "5,000 PIGGY",
        bettingAllowed: true
    },
    {
        id: "3",
        title: "Neon Racer",
        thumbnail: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=80",
        categories: ["Racing", "Arcade"],
        playerCount: "15k",
        isLive: true,
        tournamentStatus: null,
        prizePool: null,
        bettingAllowed: false
    },
    {
        id: "4",
        title: "Space Rebels",
        thumbnail: "https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=800&q=80",
        categories: ["Action", "Shooter"],
        playerCount: "5.2k",
        isLive: false,
        tournamentStatus: "Tomorrow 20:00",
        prizePool: "2,500 $UP",
        bettingAllowed: true
    },
    {
        id: "5",
        title: "Crypto Quest",
        thumbnail: "https://images.unsplash.com/photo-1642104704074-907c0698cbd9?w=800&q=80",
        categories: ["RPG", "Crypto"],
        playerCount: "22k",
        isLive: true,
        tournamentStatus: "Ongoing",
        prizePool: "50,000 $PIGGY",
        bettingAllowed: false
    },
    {
        id: "6",
        title: "Block Breaker",
        thumbnail: "https://images.unsplash.com/photo-1605901309584-818e25960b8f?w=800&q=80",
        categories: ["Puzzle", "Casual"],
        playerCount: "3.1k",
        isLive: false,
        tournamentStatus: null,
        prizePool: null,
        bettingAllowed: false
    }
];

export const TOP_APPS = [
    { name: "Piggy Poker", rank: 1, image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=150&q=80", change: "up" },
    { name: "Cyber Slots", rank: 2, image: "https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=150&q=80", change: "same" },
    { name: "Neon Racer", rank: 3, image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=150&q=80", change: "down" },
    { name: "Space Rebels", rank: 4, image: "https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=150&q=80", change: "up" },
    { name: "Crypto Quest", rank: 5, image: "https://images.unsplash.com/photo-1642104704074-907c0698cbd9?w=150&q=80", change: "up" },
];

export const ACTIVE_TOURNAMENTS = [
    {
        id: "t1",
        game: "Piggy Poker",
        gameId: "1",
        name: "Weekly High Roller",
        description: "The biggest weekly poker event in the PiggyVerse. High stakes, high rewards.",
        registered: 1230,
        maxPlayers: 2000,
        prizePool: "50,000 $PIGGY",
        entryFee: "100 $PIGGY",
        status: "Registration Open",
        startDate: "2024-03-15T20:00:00",
        image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800&q=80",
        isIncentivized: true,
        bettingMarkets: [
            {
                id: "m1",
                name: "M1 Winner",
                outcomes: [
                    { name: "RevengeIP", odds: 2.5 },
                    { name: "Holic", odds: 3.1 },
                    { name: "Mary", odds: 4.5 },
                    { name: "Field", odds: 1.8 }
                ]
            },
            {
                id: "m2",
                name: "First Blood",
                outcomes: [
                    { name: "RevengeIP", odds: 1.9 },
                    { name: "Holic", odds: 2.1 }
                ]
            },
            {
                id: "m3",
                name: "Total Rounds",
                outcomes: [
                    { name: "Over 26.5", odds: 1.85 },
                    { name: "Under 26.5", odds: 1.85 }
                ]
            }
        ],
        rules: ["No re-buys", "10 min blinds", "Standard Texas Hold'em rules"],
        prizes: ["1st: 25,000 $PIGGY", "2nd: 12,500 $PIGGY", "3rd: 6,250 $PIGGY"]
    },
    {
        id: "t2",
        game: "Neon Racer",
        gameId: "3",
        name: "Speed Demon Cup",
        description: "Prove you're the fastest racer in the galaxy. Time trial format.",
        registered: 542,
        maxPlayers: 1000,
        prizePool: "10,000 $PIGGY",
        entryFee: "Free",
        status: "Live",
        startDate: "2024-03-14T18:00:00",
        image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=80",
        isIncentivized: false,
        rules: ["Standard track", "No shortcuts allowed", "Best of 3 laps"],
        prizes: ["1st: 5,000 $PIGGY", "2nd: 3,000 $PIGGY", "3rd: 2,000 $PIGGY"]
    },
    {
        id: "t3",
        game: "Cyber Slots",
        gameId: "2",
        name: "Jackpot Sunday",
        description: "Spin to win in this massive accumulations tournament.",
        registered: 890,
        maxPlayers: 1000,
        prizePool: "25,000 $PIGGY",
        entryFee: "50 $PIGGY",
        status: "In 2h",
        startDate: "2024-03-14T22:00:00",
        image: "https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=800&q=80",
        isIncentivized: true,
        bettingMarkets: [
            {
                id: "m4",
                name: "Jackpot Winner",
                outcomes: [
                    { name: "Glitch", odds: 5.0 },
                    { name: "Neo", odds: 4.2 },
                    { name: "Trinity", odds: 3.8 },
                    { name: "Field", odds: 1.5 }
                ]
            },
            {
                id: "m5",
                name: "Winning Color",
                outcomes: [
                    { name: "Red", odds: 2.0 },
                    { name: "Black", odds: 2.0 },
                    { name: "Green", odds: 14.0 }
                ]
            }
        ],
        bettingOdds: {
            "Glitch": 5.0,
            "Neo": 4.2,
            "Trinity": 3.8,
            "Field": 1.5
        },
        rules: ["100 spins max", "Highest total payout wins", "Min bet 1 $PIGGY"],
        prizes: ["1st: 15,000 $PIGGY", "2nd: 7,500 $PIGGY", "3rd: 2,500 $PIGGY"]
    }
];

export const GLOBAL_LEADERBOARD = [
    { rank: 1, username: "RevengeIP", matchWins: 452, timePlayed: "540h", tourneyWins: 12, bestTime: "1:24.5s", effortScore: 98.5, avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80" },
    { rank: 2, username: "Holic", matchWins: 398, timePlayed: "480h", tourneyWins: 8, bestTime: "#2", effortScore: 92.4, avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150&q=80" },
    { rank: 3, username: "Mary", matchWins: 350, timePlayed: "410h", tourneyWins: 5, bestTime: "1:28.2s", effortScore: 89.0, avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&q=80" },
    { rank: 4, username: "AnneLinkA", matchWins: 320, timePlayed: "390h", tourneyWins: 4, bestTime: "#5", effortScore: 85.2, avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&q=80" },
    { rank: 5, username: "pa3gBa", matchWins: 290, timePlayed: "350h", tourneyWins: 3, bestTime: "1:32.0s", effortScore: 81.5, avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&q=80" },
    { rank: 6, username: "Nooxin", matchWins: 275, timePlayed: "330h", tourneyWins: 2, bestTime: "#12", effortScore: 78.3, avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80" },
    { rank: 7, username: "Metil", matchWins: 260, timePlayed: "310h", tourneyWins: 2, bestTime: "1:35.4s", effortScore: 75.1, avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&q=80" },
    { rank: 8, username: "DrViper", matchWins: 245, timePlayed: "290h", tourneyWins: 1, bestTime: "#25", effortScore: 72.8, avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&q=80" },
    { rank: 9, username: "Xenon", matchWins: 230, timePlayed: "280h", tourneyWins: 1, bestTime: "1:40.1s", effortScore: 70.4, avatar: "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=150&q=80" },
    { rank: 10, username: "KiloByte", matchWins: 220, timePlayed: "270h", tourneyWins: 0, bestTime: "#42", effortScore: 68.9, avatar: "https://images.unsplash.com/photo-1528892952291-009c663ce843?w=150&q=80" },
];

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
    { symbol: "USDC", name: "USD Coin", icon: "💲" }
];

export const STREAM_DATA = {
    title: "Piggy Cup Championship - Live Now!",
    streamer: "PiggyStre4m",
    viewers: 1247,
    thumbnail: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1200&q=80"
};

export const MOCK_USER_PROFILE = {
    username: "PiggyChamp",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&q=80",
    globalRank: 42,
    joinDate: "2024-01-15",
    linkedAccounts: {
        twitter: { connected: true, handle: "@PiggyChamp" },
        discord: { connected: true, handle: "PiggyChamp#1234" }
    },
    powerLevels: {
        effort: { score: 850, max: 1000 },
        proficiency: { score: 620, max: 1000 },
        activity: { score: 340, max: 1000 }
    },
    stats: {
        tournamentsHosted: 12,
        totalWins: 28,
        hoursPlayed: 342,
        currentStreak: 5
    }
};
