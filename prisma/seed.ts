import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Create a test user
    const user = await prisma.user.upsert({
        where: { username: 'TestUser' },
        update: {},
        create: {
            username: 'TestUser',
            email: 'test@piggyverse.com',
            avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&q=80',
            effortScore: 850,
            proficiencyScore: 620,
            activityScore: 340,
            globalRank: 42,
        },
    });

    console.log('✅ Created user:', user.username);

    // Create user stats
    await prisma.userStats.upsert({
        where: { userId: user.id },
        update: {},
        create: {
            userId: user.id,
            tournamentsHosted: 12,
            tournamentsWon: 5,
            totalMatchesWon: 28,
            totalHoursPlayed: 342,
            tokensEarned: 5000,
            currentStreak: 5,
        },
    });

    console.log('✅ Created user stats');

    // Create test games
    const game1 = await prisma.game.upsert({
        where: { id: 'game-1' },
        update: {},
        create: {
            id: 'game-1',
            title: 'Poker Night',
            description: 'Classic Texas Hold\'em Poker',
            thumbnailUrl: 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?w=400&q=80',
            categories: ['card', 'strategy'],
            platforms: ['web', 'mobile'],
            playerCount: 1250,
            createdById: user.id,
        },
    });

    const game2 = await prisma.game.upsert({
        where: { id: 'game-2' },
        update: {},
        create: {
            id: 'game-2',
            title: 'Battle Royale Arena',
            description: 'Last player standing wins',
            thumbnailUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&q=80',
            categories: ['action', 'multiplayer'],
            platforms: ['pc', 'console'],
            playerCount: 3420,
            createdById: user.id,
        },
    });

    console.log('✅ Created games:', game1.title, game2.title);

    // Create leaderboard entries
    // For global leaderboard (gameId is null)
    const entry = await prisma.leaderboardEntry.findFirst({
        where: {
            userId: user.id,
            gameId: null, // Use null for global leaderboard
        }
    }).catch(() => null);

    if (!entry) {
        await prisma.leaderboardEntry.create({
            data: {
                userId: user.id,
                gameId: null,
                rank: 42,
                matchWins: 28,
                timePlayedHours: 342,
                tournamentsWon: 5,
                totalScore: 1810,
            },
        });
    }

    console.log('✅ Created leaderboard entry');

    console.log('🎉 Seeding complete!');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
