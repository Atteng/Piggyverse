import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting full database cleanup (Preserving Users)...');

    try {
        // 1. Transaction Receipts
        const receiptsCount = await prisma.transactionReceipt.deleteMany({});
        console.log(`Deleted ${receiptsCount.count} transaction receipts.`);

        // 2. Chat Messages
        const chatCount = await prisma.chatMessage.deleteMany({});
        console.log(`Deleted ${chatCount.count} chat messages.`);

        // 3. Watch Sessions
        const watchCount = await prisma.watchSession.deleteMany({});
        console.log(`Deleted ${watchCount.count} watch sessions.`);

        // 4. Notifications
        const notificationCount = await prisma.notification.deleteMany({});
        console.log(`Deleted ${notificationCount.count} notifications.`);

        // 5. Bets (Depends on outcomes/markets)
        const betsCount = await prisma.bet.deleteMany({});
        console.log(`Deleted ${betsCount.count} bets.`);

        // 6. Invite Codes (Depends on tournaments)
        const codesCount = await prisma.tournamentInviteCode.deleteMany({});
        console.log(`Deleted ${codesCount.count} invite codes.`);

        // 7. Betting Outcomes (Depends on markets)
        const outcomesCount = await prisma.bettingOutcome.deleteMany({});
        console.log(`Deleted ${outcomesCount.count} betting outcomes.`);

        // 8. Betting Markets (Depends on tournaments)
        const marketsCount = await prisma.bettingMarket.deleteMany({});
        console.log(`Deleted ${marketsCount.count} betting markets.`);

        // 9. Tournament Registrations (Depends on tournaments/users)
        const registrationsCount = await prisma.tournamentRegistration.deleteMany({});
        console.log(`Deleted ${registrationsCount.count} tournament registrations.`);

        // 10. Tournaments (Depends on games)
        const tournamentCount = await prisma.tournament.deleteMany({});
        console.log(`Deleted ${tournamentCount.count} tournaments.`);

        // 11. Leaderboard Entries (Depends on games/users)
        const leaderboardCount = await prisma.leaderboardEntry.deleteMany({});
        console.log(`Deleted ${leaderboardCount.count} leaderboard entries.`);

        // 12. Games
        const gameCount = await prisma.game.deleteMany({});
        console.log(`Deleted ${gameCount.count} games.`);

        console.log('Cleanup complete. Users and UserStats have been preserved.');
    } catch (error) {
        console.error('Error during cleanup:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
