import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
    request: NextRequest,
    context: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const params = await Promise.resolve(context.params);
        if (!params || !params.id) {
            return NextResponse.json({ error: "Tournament ID is required" }, { status: 400 });
        }

        const tournamentId = params.id;

        // 1. Verify ownership
        const tournament = await prisma.tournament.findUnique({
            where: { id: tournamentId },
            select: { hostId: true, status: true }
        });

        if (!tournament) {
            return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
        }

        if (tournament.hostId !== session.user.id) {
            return NextResponse.json({ error: "Only the host can cancel this tournament" }, { status: 403 });
        }

        if (tournament.status === 'COMPLETED' || tournament.status === 'CANCELLED') {
            return NextResponse.json({ error: "Tournament is already finalized" }, { status: 400 });
        }

        // 2. Perform Cancellation
        // In a real scenario, this might trigger refunds for entry fees or bets.
        // For now, we simply update the status to CANCELLED and close any open betting markets.
        await prisma.$transaction([
            prisma.tournament.update({
                where: { id: tournamentId },
                data: { status: 'CANCELLED' }
            }),
            prisma.bettingMarket.updateMany({
                where: { tournamentId, status: 'OPEN' },
                data: { status: 'CANCELLED' }
            })
        ]);

        console.log(`[Manual-Cancel] Tournament ${tournamentId} cancelled by host ${session.user.id}`);

        return NextResponse.json({ message: "Tournament cancelled successfully" });

    } catch (error) {
        console.error("[Manual Cancel Error]:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to cancel tournament" },
            { status: 500 }
        );
    }
}
