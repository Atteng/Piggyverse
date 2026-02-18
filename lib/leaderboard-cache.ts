/**
 * Leaderboard Caching Utility
 * Caches top users to reduce database load
 */

import { prisma } from '@/lib/prisma';
import type { User } from '@prisma/client';

interface CachedLeaderboard {
    users: Partial<User>[];
    cachedAt: number;
    ttl: number; // Time to live in milliseconds
}

const leaderboardCache = new Map<string, CachedLeaderboard>();

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
const TOP_USERS_LIMIT = 100;

/**
 * Get top users by global rank with caching
 */
export async function getTopUsers(limit: number = 10): Promise<Partial<User>[]> {
    const cacheKey = `top_${limit}`;
    const cached = leaderboardCache.get(cacheKey);

    // Return cached if still valid
    if (cached && Date.now() - cached.cachedAt < cached.ttl) {
        return cached.users.slice(0, limit);
    }

    // Fetch from database
    const users = await prisma.user.findMany({
        where: {
            globalRank: { gt: 0 } // Only users with calculated ranks
        },
        orderBy: {
            globalRank: 'desc'
        },
        take: Math.max(limit, TOP_USERS_LIMIT), // Cache more than requested
        select: {
            id: true,
            username: true,
            avatarUrl: true,
            globalRank: true,
            effortScore: true,
            proficiencyScore: true,
            activityScore: true
        }
    });

    // Cache the result
    leaderboardCache.set(cacheKey, {
        users,
        cachedAt: Date.now(),
        ttl: DEFAULT_TTL
    });

    return users.slice(0, limit);
}

/**
 * Get users by specific score type
 */
export async function getTopUsersByScore(
    scoreType: 'effort' | 'proficiency' | 'activity',
    limit: number = 10
): Promise<Partial<User>[]> {
    const cacheKey = `top_${scoreType}_${limit}`;
    const cached = leaderboardCache.get(cacheKey);

    if (cached && Date.now() - cached.cachedAt < cached.ttl) {
        return cached.users.slice(0, limit);
    }

    const orderByField = scoreType === 'effort' ? 'effortScore' :
        scoreType === 'proficiency' ? 'proficiencyScore' :
            'activityScore';

    const users = await prisma.user.findMany({
        where: {
            [orderByField]: { gt: 0 }
        },
        orderBy: {
            [orderByField]: 'desc'
        },
        take: limit,
        select: {
            id: true,
            username: true,
            avatarUrl: true,
            globalRank: true,
            effortScore: true,
            proficiencyScore: true,
            activityScore: true
        }
    });

    leaderboardCache.set(cacheKey, {
        users,
        cachedAt: Date.now(),
        ttl: DEFAULT_TTL
    });

    return users;
}

/**
 * Invalidate leaderboard cache
 * Call this after batch rank updates
 */
export function invalidateLeaderboardCache(): void {
    leaderboardCache.clear();
}

/**
 * Get cache status (for monitoring)
 */
export function getCacheStatus() {
    const entries = Array.from(leaderboardCache.entries()).map(([key, value]) => ({
        key,
        size: value.users.length,
        age: Date.now() - value.cachedAt,
        ttl: value.ttl
    }));

    return {
        cacheSize: leaderboardCache.size,
        entries
    };
}

/**
 * Warm up the cache with common queries
 * Run this on server startup or after batch updates
 */
export async function warmUpCache(): Promise<void> {
    await Promise.all([
        getTopUsers(10),
        getTopUsers(50),
        getTopUsers(100),
        getTopUsersByScore('effort', 10),
        getTopUsersByScore('proficiency', 10),
        getTopUsersByScore('activity', 10)
    ]);
}

// Auto-invalidate cache every 5 minutes
if (typeof window === 'undefined') {
    setInterval(() => {
        invalidateLeaderboardCache();
    }, DEFAULT_TTL);
}
