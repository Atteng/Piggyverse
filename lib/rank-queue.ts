/**
 * Async Rank Update Queue
 * Prevents blocking on rank calculations by queuing updates
 * Processes in batches for efficiency
 */

import { updateUserRank } from './stats';
import { prisma } from '@/lib/prisma';

// In-memory queue (for production, use Redis/Bull)
const rankUpdateQueue = new Set<string>();
let isProcessing = false;

/**
 * Queue a user for rank update (non-blocking)
 */
export async function queueRankUpdate(userId: string): Promise<void> {
    rankUpdateQueue.add(userId);

    // Mark user as needing update in DB (for persistence across restarts)
    await prisma.user.update({
        where: { id: userId },
        data: { needsRankUpdate: true }
    }).catch(() => {
        // Ignore errors - queue will handle it
    });

    // Trigger processing if not already running
    if (!isProcessing) {
        processQueue();
    }
}

/**
 * Process queued rank updates in batches
 */
async function processQueue(): Promise<void> {
    if (isProcessing || rankUpdateQueue.size === 0) return;

    isProcessing = true;

    try {
        // Process in batches of 50
        const batch: string[] = [];
        const iterator = rankUpdateQueue.values();

        for (let i = 0; i < 50; i++) {
            const next = iterator.next();
            if (next.done) break;
            batch.push(next.value);
            rankUpdateQueue.delete(next.value);
        }

        // Update ranks in parallel (with concurrency limit)
        await Promise.all(
            batch.map(userId =>
                updateUserRank(userId).catch(err => {
                    console.error(`Failed to update rank for ${userId}:`, err);
                    // Re-queue on failure
                    rankUpdateQueue.add(userId);
                })
            )
        );

        // Continue processing if queue still has items
        if (rankUpdateQueue.size > 0) {
            setTimeout(processQueue, 100); // Small delay between batches
        }
    } finally {
        isProcessing = false;
    }
}

/**
 * Batch update all users marked as needing rank update
 * Run this via cron job every 5-10 minutes
 */
export async function batchUpdateRanks(): Promise<number> {
    const usersToUpdate = await prisma.user.findMany({
        where: { needsRankUpdate: true },
        select: { id: true },
        take: 1000 // Process 1000 at a time
    });

    console.log(`[Rank Update] Processing ${usersToUpdate.length} users`);

    let updated = 0;
    for (const user of usersToUpdate) {
        try {
            await updateUserRank(user.id);
            updated++;
        } catch (err) {
            console.error(`Failed to update rank for ${user.id}:`, err);
        }
    }

    return updated;
}

/**
 * Get queue status (for monitoring)
 */
export function getQueueStatus() {
    return {
        queueSize: rankUpdateQueue.size,
        isProcessing
    };
}

// Auto-start queue processor on import
if (typeof window === 'undefined') {
    // Server-side only
    setInterval(() => {
        if (rankUpdateQueue.size > 0 && !isProcessing) {
            processQueue();
        }
    }, 5000); // Check every 5 seconds
}
