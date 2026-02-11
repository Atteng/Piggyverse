import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/watch-to-earn/end - End a watch session and calculate rewards
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const body = await request.json();
        const { sessionId } = body;

        if (!sessionId) {
            return NextResponse.json(
                { error: 'Session ID is required' },
                { status: 400 }
            );
        }

        // Find the active session
        const watchSession = await prisma.watchSession.findUnique({
            where: { id: sessionId }
        });

        if (!watchSession) {
            return NextResponse.json(
                { error: 'Session not found' },
                { status: 404 }
            );
        }

        if (watchSession.userId !== user.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            );
        }

        if (watchSession.effortPointsEarned > 0) {
            return NextResponse.json(
                { error: 'Session already ended' },
                { status: 400 }
            );
        }

        const endTime = new Date();
        const durationMs = endTime.getTime() - watchSession.startedAt.getTime();
        const durationMinutes = Math.floor(durationMs / 60000);
        const durationSeconds = Math.floor(durationMs / 1000);

        // Calculate points: 1 point per minute watched
        const pointsEarned = durationMinutes;

        // Update session
        // Note: Schema doesn't have endTime, so we update points and duration
        const updatedSession = await prisma.watchSession.update({
            where: { id: sessionId },
            data: {
                lastPing: endTime,
                effortPointsEarned: pointsEarned,
                watchTimeSeconds: durationSeconds
            }
        });

        // Create notification
        if (pointsEarned > 0) {
            await prisma.notification.create({
                data: {
                    userId: user.id,
                    type: 'EARNING',
                    title: 'Watch Rewards Earned',
                    message: `You earned ${pointsEarned} points for watching!`,
                    actionUrl: '/profile',
                    actionLabel: 'View Profile',
                    amount: pointsEarned
                }
            });

            // Update User Stats
            await prisma.userStats.upsert({
                where: { userId: user.id },
                update: {
                    totalHoursPlayed: { increment: Math.floor(durationMinutes / 60) },
                    tokensEarned: { increment: pointsEarned },
                    lastActivity: new Date()
                },
                create: {
                    userId: user.id,
                    totalHoursPlayed: Math.floor(durationMinutes / 60),
                    tokensEarned: pointsEarned,
                    lastActivity: new Date()
                }
            });

            // Update User Scores
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    effortScore: { increment: pointsEarned },
                    activityScore: { increment: Math.ceil(pointsEarned / 5) } // 20% activity score
                }
            });

            // Update Global Leaderboard
            const lbEntry = await prisma.leaderboardEntry.findFirst({
                where: { userId: user.id, gameId: null }
            });

            if (lbEntry) {
                await prisma.leaderboardEntry.update({
                    where: { id: lbEntry.id },
                    data: {
                        totalScore: { increment: pointsEarned },
                        timePlayedHours: { increment: Math.floor(durationMinutes / 60) }
                    }
                });
            } else {
                await prisma.leaderboardEntry.create({
                    data: {
                        userId: user.id,
                        gameId: null,
                        rank: 999,
                        totalScore: pointsEarned,
                        tournamentsWon: 0,
                        timePlayedHours: Math.floor(durationMinutes / 60),
                        matchWins: 0
                    }
                });
            }
        }

        return NextResponse.json({
            ...updatedSession,
            durationMinutes,
            pointsEarned
        });
    } catch (error) {
        console.error('Error ending watch session:', error);
        return NextResponse.json(
            { error: 'Failed to end watch session' },
            { status: 500 }
        );
    }
}
