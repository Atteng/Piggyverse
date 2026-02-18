import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { recordMatchResult } from '@/lib/stats';

// POST /api/tournaments/[id]/match-result - Log a match result (Host only)
export async function POST(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { winnerId, loserId, matchData } = body;

        if (!winnerId || !loserId) {
            return NextResponse.json(
                { error: 'Winner and Loser IDs are required' },
                { status: 400 }
            );
        }

        // Fetch tournament to check permissions
        const tournament = await prisma.tournament.findUnique({
            where: { id: params.id },
            select: { hostId: true, gameId: true }
        });

        if (!tournament) {
            return NextResponse.json(
                { error: 'Tournament not found' },
                { status: 404 }
            );
        }

        // Only tournament host can log results
        if (tournament.hostId !== session.user.id) {
            return NextResponse.json(
                { error: 'Only tournament host can log match results' },
                { status: 403 }
            );
        }

        // Record the result stats (async)
        await recordMatchResult(winnerId, loserId, tournament.gameId);

        // Here we could also store the match log in a separate table if needed
        // For now, we just update the stats

        return NextResponse.json({
            success: true,
            winnerId,
            loserId
        });
    } catch (error) {
        console.error('Error logging match result:', error);
        return NextResponse.json(
            { error: 'Failed to log match result' },
            { status: 500 }
        );
    }
}
