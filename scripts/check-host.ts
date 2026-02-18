import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
    const tournament = await prisma.tournament.findFirst({
        where: { name: { contains: 'SuperBBQ' } },
        select: {
            id: true,
            hostId: true,
            host: { select: { id: true, username: true } }
        }
    });
    console.log('Tournament host info:', JSON.stringify(tournament, null, 2));

    // Also list all users so we can cross-reference
    const users = await prisma.user.findMany({
        select: { id: true, username: true }
    });
    console.log('\nAll users:', JSON.stringify(users, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
