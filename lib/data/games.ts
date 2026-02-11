
export interface Game {
    id: string;
    title: string;
    description: string;
    category: string;

    // Assets
    coverImage: string;    // Vertical poster for library (3:4)
    bannerImage: string;   // Horizontal banner for hero/details (16:9)
    icon: string;          // Small square icon (1:1)

    // Stats
    activePlayers: number;
    prizePool: string;
    isHot?: boolean;
    isNew?: boolean;

    // Styling
    primaryColor: string; // Hex code for accents
}

export const games: Game[] = [
    {
        id: "poker-showdown",
        title: "Poker Showdown",
        description: "High-stakes Texas Hold'em tournaments with crypto buy-ins.",
        category: "Card Game",
        coverImage: "/images/games/poker-cover.jpg",
        bannerImage: "/images/games/poker-banner.jpg",
        icon: "/images/games/poker-icon.png",
        activePlayers: 1240,
        prizePool: "$5k Pool",
        isHot: true,
        primaryColor: "#ef4444"
    },
    {
        id: "cyber-slots",
        title: "Cyber Slots",
        description: "Provably fair slot machines with neon aesthetics.",
        category: "Casino",
        coverImage: "/images/games/slots-cover.jpg",
        bannerImage: "/images/games/slots-banner.jpg",
        icon: "/images/games/slots-icon.png",
        activePlayers: 850,
        prizePool: "$2.5k Pool",
        primaryColor: "#a855f7"
    },
    {
        id: "neon-racer",
        title: "Neon Racer",
        description: "Futuristic racing game with play-to-earn mechanics.",
        category: "Racing",
        coverImage: "/images/games/racing-cover.jpg",
        bannerImage: "/images/games/racing-banner.jpg",
        icon: "/images/games/racing-icon.png",
        activePlayers: 2500,
        prizePool: "$10k Pool",
        isHot: true,
        primaryColor: "#eab308"
    },
    {
        id: "piggy-blast",
        title: "Piggy Blast",
        description: "Match-3 puzzle game with Piggy styling.",
        category: "Arcade",
        coverImage: "/images/games/blast-cover.jpg",
        bannerImage: "/images/games/blast-banner.jpg",
        icon: "/images/games/blast-icon.png",
        activePlayers: 3100,
        prizePool: "$15k Pool",
        isHot: true,
        primaryColor: "#ec4899"
    },
    {
        id: "space-tactics",
        title: "Space Tactics",
        description: "Turn-based strategy in deep space.",
        category: "Strategy",
        coverImage: "/images/games/space-cover.jpg",
        bannerImage: "/images/games/space-banner.jpg",
        icon: "/images/games/space-icon.png",
        activePlayers: 500,
        prizePool: "$1k Pool",
        primaryColor: "#3b82f6"
    }
];

export function getFeaturedGame() {
    return games.find(g => g.id === "neon-racer") || games[0];
}
