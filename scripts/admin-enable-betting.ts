import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env from root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Use DIRECT_DATABASE_URL to bypass pooling issues in scripts
const databaseUrl = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: databaseUrl,
        },
    },
});

/**
 * ADMIN SCRIPT: Enable betting for a tournament and create default markets
 * Usage: npx tsx scripts/admin-enable-betting.ts [TOURNAMENT_ID]
 */
async function main() {
    const tournamentId = process.argv[2];

    if (!tournamentId) {
        console.error('Please provide a tournament ID');
        console.log('Usage: npx tsx scripts/admin-enable-betting.ts [TOURNAMENT_ID]');
        process.exit(1);
    }

    console.log(`--- PiggyDAO Admin: Enabling Betting for ${tournamentId} ---`);

    try {
        // 1. Fetch tournament and current participants
        const tournament = await prisma.tournament.findUnique({
            where: { id: tournamentId },
            include: {
                registrations: {
                    include: { user: true }
                },
                bettingMarkets: true
            }
        });

        if (!tournament) {
            console.error('Tournament not found');
            process.exit(1);
        }

        // 2. Enable betting flag
        await prisma.tournament.update({
            where: { id: tournamentId },
            data: { allowBetting: true }
        });
        console.log('✅ Tournament allowBetting set to TRUE');

        // 3. Create a default Winner market if none exists
        if (tournament.bettingMarkets.length === 0) {
            console.log('Creating default "Tournament Winner" market...');

            const participants = tournament.registrations.map(r => r.user);

            if (participants.length === 0) {
                console.warn('⚠️ No participants found. Creating market without outcomes.');
            }

            const market = await prisma.bettingMarket.create({
                data: {
                    tournamentId,
                    marketType: 'PARIMUTUEL',
                    marketQuestion: 'Who will win the tournament?',
                    poolPreSeed: 0,
                    poolPreSeedToken: 'PIGGY',
                    minBet: 1,
                    bookmakingFee: 0,
                    outcomes: {
                        create: participants.map(p => ({
                            label: p.username || 'Anonymous Participant',
                        }))
                    }
                }
            });
            console.log(`✅ Default market created: ${market.id}`);
        } else {
            console.log(`ℹ️ Tournament already has ${tournament.bettingMarkets.length} market(s).`);
        }

        console.log('--- Done! ---');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
