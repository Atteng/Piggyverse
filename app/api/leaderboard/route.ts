import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/leaderboard - Get global or game-specific leaderboard
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const gameId = searchParams.get("gameId");
        const limit = parseInt(searchParams.get("limit") || "10");

        // If no gameId, fetch global leaderboard from User model
        if (!gameId) {
            const users = await prisma.user.findMany({
                where: {
                    globalRank: { gt: 0 }
                },
                orderBy: {
                    globalRank: "desc"
                },
                take: limit,
                select: {
                    id: true,
                    username: true,
                    avatarUrl: true,
                    globalRank: true,
                    effortScore: true,
                    proficiencyScore: true,
                    activityScore: true,
                    stats: {
                        select: {
                            matchWins: true,
                            totalHoursPlayed: true,
                            tournamentsWon: true,
                        }
                    }
                }
            });

            // Map to expected format
            const entries = users.map((user, index) => ({
                rank: index + 1,
                user: {
                    id: user.id,
                    username: user.username,
                    avatarUrl: user.avatarUrl,
                    effortScore: user.effortScore
                },
                // Flatten stats for frontend compatibility
                matchWins: user.stats?.matchWins || 0,
                timePlayedHours: user.stats?.totalHoursPlayed || 0,
                tournamentsWon: user.stats?.tournamentsWon || 0,
                game: null
            }));

            return NextResponse.json(entries);
        }

        // Game-specific leaderboard (keep existing logic)
        const entries = await prisma.leaderboardEntry.findMany({
            where: { gameId },
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
