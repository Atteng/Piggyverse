import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/user/sync - Update user activity and streaks
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: (session.user as any).id },
            include: { stats: true }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const now = new Date();
        const lastActivity = user.stats?.lastActivity;
        let currentStreak = user.stats?.currentStreak || 0;

        // Streak Logic
        if (lastActivity) {
            const diffTime = Math.abs(now.getTime() - lastActivity.getTime());
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            // Check if last activity was yesterday (1 day difference)
            // Using logic: if > 24h and < 48h, increment.
            // If < 24h, check if it's a different calendar day?
            // Simplified: If > 24h since last activity, increment. If > 48h, reset.

            // Allow checking once per day.
            // If last activity was today (less than 24h ago AND same calendar day), do nothing.

            const isSameDay =
                now.getDate() === lastActivity.getDate() &&
                now.getMonth() === lastActivity.getMonth() &&
                now.getFullYear() === lastActivity.getFullYear();

            if (!isSameDay) {
                // Different day
                const hoursSinceLast = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);

                if (hoursSinceLast < 48) {
                    // Within 48 hours = Consecutive day
                    currentStreak += 1;
                } else {
                    // Streak broken
                    currentStreak = 1;
                }
            } else {
                // Same day, ensure streak is at least 1 if undefined
                if (currentStreak === 0) currentStreak = 1;
            }
        } else {
            // First time
            currentStreak = 1;
        }

        // Upsert UserStats
        const updatedStats = await prisma.userStats.upsert({
            where: { userId: user.id },
            update: {
                lastActivity: now,
                currentStreak: currentStreak,
            },
            create: {
                userId: user.id,
                lastActivity: now,
                currentStreak: 1,
                tournamentsHosted: 0,
                tournamentsWon: 0,
                totalMatchesWon: 0,
                totalHoursPlayed: 0,
                tokensEarned: 0
            }
        });

        // Also update Leaderboard Entry if it exists (for score)
        // We add points for activity? Maybe later. For now just track streak.

        return NextResponse.json(updatedStats);
    } catch (error) {
        console.error("Error syncing user stats:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
