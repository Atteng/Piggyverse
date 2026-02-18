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

async function main() {
    console.log('--- Current Tournaments in DB ---');
    try {
        const tournaments = await prisma.tournament.findMany({
            select: {
                id: true,
                name: true,
                status: true,
                allowBetting: true,
                host: {
                    select: {
                        username: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        if (tournaments.length === 0) {
            console.log('No tournaments found.');
        } else {
            console.table(tournaments.map(t => ({
                ID: t.id,
                Name: t.name,
                Host: t.host.username || 'N/A',
                Status: t.status,
                'Betting?': t.allowBetting ? 'YES' : 'NO'
            })));
        }
    } catch (error) {
        console.error('Error fetching tournaments:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
