import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/leaderboard - Get global or game-specific leaderboard
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const gameId = searchParams.get("gameId");
        const limit = parseInt(searchParams.get("limit") || "10");

        const where: any = {};
        if (gameId) {
            where.gameId = gameId;
        } else {
            where.gameId = null; // Global leaderboard
        }

        const entries = await prisma.leaderboardEntry.findMany({
            where,
            take: limit,
            orderBy: {
                rank: "asc",
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        avatarUrl: true,
                        globalRank: true,
                        effortScore: true,
                        proficiencyScore: true,
                        activityScore: true,
                    },
                },
                game: {
                    select: {
                        id: true,
                        title: true,
                        thumbnailUrl: true,
                    },
                },
            },
        });

        return NextResponse.json(entries);
    } catch (error) {
        console.error("Error fetching leaderboard:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
