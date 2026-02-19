
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    try {
        // Fetch user with stats and recent activity
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                stats: true,
                registrations: {
                    take: 5,
                    orderBy: { registeredAt: 'desc' },
                    include: {
                        tournament: {
                            select: { name: true }
                        }
                    }
                },
                bets: {
                    where: { status: 'WON' },
                    take: 5,
                    orderBy: { placedAt: 'desc' },
                }
            }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Initialize stats if they don't exist (edge case)
        const stats = user.stats || {
            effortScore: 0,
            proficiencyScore: 0,
            activityScore: 0,
            matchWins: 0,
            tournamentsWon: 0,
            totalHoursPlayed: 0
        };

        // Format recent activity
        const tournamentActivity = user.registrations.map(reg => ({
            type: 'tournament_join',
            name: reg.tournament.name,
            date: reg.registeredAt.toISOString().split('T')[0]
        }));

        const betActivity = user.bets.map(bet => ({
            type: 'bet_won',
            amount: bet.payoutAmount || 0,
            token: bet.token,
            date: bet.placedAt.toISOString().split('T')[0]
        }));

        // Merge and sort activity
        const recentActivity = [...tournamentActivity, ...betActivity]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);

        const userStats = {
            username: user.username || user.email || 'User',
            rank: user.globalRank, // In a real app this would be position in leaderboard, here using score/rank
            globalScore: user.globalRank, // Frontend likely uses this for display
            stats: {
                effort: user.effortScore || 0, // Fallback to 0 if null
                proficiency: user.proficiencyScore || 0,
                activity: user.activityScore || 0,
                matchWins: stats.matchWins,
                tournamentWins: stats.tournamentsWon,
                timePlayedHours: stats.totalHoursPlayed,
            },
            recentActivity
        };

        return NextResponse.json(userStats);
    } catch (error) {
        console.error("Error fetching user stats:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
