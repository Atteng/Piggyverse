import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/watch-to-earn/start - Start a watch session
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: (session.user as any).id }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const body = await request.json();
        const { streamId } = body;

        if (!streamId) {
            return NextResponse.json(
                { error: 'Stream ID is required' },
                { status: 400 }
            );
        }

        // Check if user already has an active session for this stream
        // Note: Schema doesn't have endTime, so we rely on client behavior or lastPing
        const existingSession = await prisma.watchSession.findFirst({
            where: {
                userId: user.id,
                streamId,
                startedAt: {
                    gt: new Date(Date.now() - 5 * 60 * 1000) // check last 5 mins
                }
            }
        });

        if (existingSession) {
            return NextResponse.json(
                { error: 'Active session already exists' },
                { status: 400 }
            );
        }

        // Create new watch session
        const watchSession = await prisma.watchSession.create({
            data: {
                userId: user.id,
                streamId,
                startedAt: new Date(),
                lastPing: new Date()
            }
        });

        return NextResponse.json(watchSession, { status: 201 });
    } catch (error) {
        console.error('Error starting watch session:', error);
        return NextResponse.json(
            { error: 'Failed to start watch session' },
            { status: 500 }
        );
    }
}
