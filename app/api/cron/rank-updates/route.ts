/**
 * Cron Job: Batch Rank Updates
 * Run this endpoint every 5-10 minutes via cron
 * Example: curl -X POST http://localhost:3000/api/cron/rank-updates
 */

import { NextRequest, NextResponse } from 'next/server';
import { batchUpdateRanks, getQueueStatus } from '@/lib/rank-queue';
import { invalidateLeaderboardCache, warmUpCache } from '@/lib/leaderboard-cache';

// Protect this endpoint with a secret key
const CRON_SECRET = process.env.CRON_SECRET || 'dev-secret-change-in-production';

export async function POST(request: NextRequest) {
    try {
        // Verify cron secret
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const startTime = Date.now();

        // Get queue status before processing
        const queueBefore = getQueueStatus();

        // Process batch updates
        const updated = await batchUpdateRanks();

        // Invalidate and warm up cache
        invalidateLeaderboardCache();
        await warmUpCache();

        const queueAfter = getQueueStatus();
        const duration = Date.now() - startTime;

        return NextResponse.json({
            success: true,
            stats: {
                usersUpdated: updated,
                queueBefore: queueBefore.queueSize,
                queueAfter: queueAfter.queueSize,
                duration: `${duration}ms`
            }
        });
    } catch (error) {
        console.error('Cron job error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Allow GET for health check
export async function GET() {
    const status = getQueueStatus();
    return NextResponse.json({
        healthy: true,
        queue: status
    });
}
