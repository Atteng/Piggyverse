import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateGameRanks } from "@/lib/stats";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Basic admin check - in production use a more robust check
        const adminEmails = (process.env.ADMIN_EMAILS || "").split(",");
        if (!session?.user?.email || !adminEmails.includes(session.user.email)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch all distinct games that have leaderboard entries
        const games = await prisma.leaderboardEntry.findMany({
            select: { gameId: true },
            distinct: ['gameId'],
        });

        console.log(`[Admin] Starting retroactive sync for ${games.length} games...`);

        for (const { gameId } of games) {
            if (gameId) {
                console.log(`[Admin] Syncing ranks for game: ${gameId}`);
                await updateGameRanks(gameId);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Synced ${games.length} game leaderboards.`
        });
    } catch (error) {
        console.error("Admin Rank Sync Error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal server error" },
            { status: 500 }
        );
    }
}
