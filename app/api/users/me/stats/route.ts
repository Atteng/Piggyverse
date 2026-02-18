import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/users/me/stats - Get current user stats
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { stats: true }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (!user.stats) {
            // Create default stats if they don't exist
            const newStats = await prisma.userStats.create({
                data: {
                    userId: session.user.id,
                },
            });
            return NextResponse.json({
                ...newStats,
                globalRank: user.globalRank,
                effortScore: user.effortScore,
                proficiencyScore: user.proficiencyScore,
                activityScore: user.activityScore
            });
        }

        return NextResponse.json({
            ...user.stats,
            globalRank: user.globalRank,
            effortScore: user.effortScore,
            proficiencyScore: user.proficiencyScore,
            activityScore: user.activityScore
        });
    } catch (error) {
        console.error("Error fetching user stats:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
