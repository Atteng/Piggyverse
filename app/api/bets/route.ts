
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Simulate bet placement
    const bet = {
        id: Math.random().toString(36).substr(2, 9),
        userId: session.user?.email, // using email as ID proxy for now
        ...body,
        timestamp: new Date().toISOString(),
        status: 'pending',
    };

    return NextResponse.json(bet, { status: 201 });
}
