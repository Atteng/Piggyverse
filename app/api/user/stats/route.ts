
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

export async function GET() {
    const session = await getServerSession(authOptions);

    // Mock user stats
    const userStats = {
        username: session?.user?.name || 'Guest',
        rank: 42,
        globalScore: 5400,
        stats: {
            effort: 2000,
            proficiency: 1500,
            activity: 1900,
            matchWins: 45,
            tournamentWins: 1,
            timePlayedHours: 120,
        },
        recentActivity: [
            { type: 'tournament_join', name: 'Poker Night', date: '2026-02-07' },
            { type: 'bet_won', amount: 500, token: 'PIGGY', date: '2026-02-06' },
        ]
    };

    return NextResponse.json(userStats);
}
