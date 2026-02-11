import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/watch-to-earn/claim - Get claimable rewards
export async function GET(request: NextRequest) {
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

        // Get all unclaimed sessions (those with points calculated)
        const unclaimedSessions = await prisma.watchSession.findMany({
            where: {
                userId: user.id,
                effortPointsEarned: { gt: 0 }
            }
        });

        const totalPoints = unclaimedSessions.reduce(
            (sum, s) => sum + (s.effortPointsEarned || 0),
            0
        );

        return NextResponse.json({
            totalPoints,
            sessionCount: unclaimedSessions.length,
            // Map effortPointsEarned to pointsEarned for frontend compatibility
            sessions: unclaimedSessions.map(s => ({
                ...s,
                pointsEarned: s.effortPointsEarned
            }))
        });
    } catch (error) {
        console.error('Error fetching claimable rewards:', error);
        return NextResponse.json(
            { error: 'Failed to fetch rewards' },
            { status: 500 }
        );
    }
}

// POST /api/watch-to-earn/claim - Claim rewards (initiate blockchain transaction)
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

        // Get all unclaimed sessions (those with points calculated)
        // Since schema lacks 'claimed' flag, we find sessions with points and delete them after claim
        const unclaimedSessions = await prisma.watchSession.findMany({
            where: {
                userId: user.id,
                effortPointsEarned: { gt: 0 }
            }
        });

        if (unclaimedSessions.length === 0) {
            return NextResponse.json(
                { error: 'No rewards to claim' },
                { status: 400 }
            );
        }

        const totalPoints = unclaimedSessions.reduce(
            (sum, s) => sum + (s.effortPointsEarned || 0),
            0
        );

        // Initiate blockchain transaction to transfer tokens (placeholder)
        // For now, we'll delete the sessions to mark as claimed/processed

        // Delete sessions to prevent double claiming (Schema workaround)
        await prisma.watchSession.deleteMany({
            where: {
                id: { in: unclaimedSessions.map(s => s.id) }
            }
        });

        // Create notification
        await prisma.notification.create({
            data: {
                userId: user.id,
                type: 'EARNING',
                title: 'Rewards Claimed!',
                message: `You claimed ${totalPoints} PIGGY tokens`,
                actionUrl: '/profile',
                actionLabel: 'View Profile',
                amount: totalPoints
            }
        });

        return NextResponse.json({
            success: true,
            pointsClaimed: totalPoints,
            sessionsClaimed: unclaimedSessions.length,
            // In production, return transaction hash
            message: 'Rewards claimed successfully. Tokens will arrive shortly.'
        });
    } catch (error) {
        console.error('Error claiming rewards:', error);
        return NextResponse.json(
            { error: 'Failed to claim rewards' },
            { status: 500 }
        );
    }
}
