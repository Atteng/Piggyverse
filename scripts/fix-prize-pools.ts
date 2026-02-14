import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Updating existing tournaments with null prizePoolAmount...');

    const result = await prisma.tournament.updateMany({
        where: {
            prizePoolAmount: null,
            isIncentivized: true,
        },
        data: {
            prizePoolAmount: 0,
        },
    });

    console.log(`Updated ${result.count} tournaments.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
