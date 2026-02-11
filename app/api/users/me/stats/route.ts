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

        const stats = await prisma.userStats.findUnique({
            where: { userId: session.user.id },
        });

        if (!stats) {
            // Create default stats if they don't exist
            const newStats = await prisma.userStats.create({
                data: {
                    userId: session.user.id,
                },
            });
            return NextResponse.json(newStats);
        }

        return NextResponse.json(stats);
    } catch (error) {
        console.error("Error fetching user stats:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
