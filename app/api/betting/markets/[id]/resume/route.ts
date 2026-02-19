import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const { id: marketId } = await params;

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 1. Fetch Market
        const market = await prisma.bettingMarket.findUnique({
            where: { id: marketId },
            include: {
                tournament: { select: { hostId: true } }
            }
        });

        if (!market) {
            return NextResponse.json({ error: "Market not found" }, { status: 404 });
        }

        // 2. Verify Host
        if (market.tournament.hostId !== session.user.id) {
            return NextResponse.json({ error: "Only the tournament host can resume betting" }, { status: 403 });
        }

        // 3. Resume Market
        const updatedMarket = await prisma.bettingMarket.update({
            where: { id: marketId },
            data: {
                isPaused: false,
                suspensionReason: null
            }
        });

        return NextResponse.json(updatedMarket);

    } catch (error) {
        console.error("Error resuming market:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
