import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ResolutionStatus } from "@prisma/client";

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
                tournament: { select: { hostId: true } },
                outcomes: true
            }
        });

        if (!market) {
            return NextResponse.json({ error: "Market not found" }, { status: 404 });
        }

        // 2. Verify Host
        if (market.tournament.hostId !== session.user.id) {
            return NextResponse.json({ error: "Only the tournament host can approve results" }, { status: 403 });
        }

        // 3. Verify Status
        if (market.resolutionStatus !== ResolutionStatus.PROPOSED || !market.aiProposedWinnerId) {
            return NextResponse.json({ error: "No pending AI proposal to approve" }, { status: 400 });
        }

        // 4. Execute Approval & Settlement
        const result = await prisma.$transaction(async (tx) => {
            // Update Market
            const updatedMarket = await tx.bettingMarket.update({
                where: { id: marketId },
                data: {
                    status: 'SETTLED',
                    resolutionStatus: ResolutionStatus.APPROVED,
                    winningOutcomeId: market.aiProposedWinnerId
                }
            });

            // Mark Winning Bets
            await tx.bet.updateMany({
                where: {
                    marketId: marketId,
                    outcomeId: market.aiProposedWinnerId!,
                    status: 'PENDING'
                },
                data: { status: 'WON' }
            });

            // Mark Losing Bets
            await tx.bet.updateMany({
                where: {
                    marketId: marketId,
                    outcomeId: { not: market.aiProposedWinnerId! },
                    status: 'PENDING'
                },
                data: { status: 'LOST' }
            });

            return updatedMarket;
        });

        return NextResponse.json(result);

    } catch (error) {
        console.error("Error approving market:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
