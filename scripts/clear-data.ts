import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

// Force load .env from project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

async function main() {
    console.log('🧹 Clearing database data...');

    try {
        // 1. Delete Tournaments (Cascades to Registrations, Markets, Outcomes, Bets)
        console.log('Deleting Tournaments...');
        await prisma.tournament.deleteMany({});
        console.log('✅ Tournaments deleted.');

        // 2. Delete Games (Cascades to nothing critical blocking, LeaderboardEntries SetNull)
        console.log('Deleting Games...');
        await prisma.game.deleteMany({});
        console.log('✅ Games deleted.');

        // 3. Delete Users (Cascades to Accounts, Sessions, Stats, LeaderboardEntries, etc.)
        console.log('Deleting Users...');
        await prisma.user.deleteMany({});
        console.log('✅ Users deleted.');

        console.log('🎉 Database cleared successfully!');
    } catch (error) {
        console.error('❌ Error clearing database:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
