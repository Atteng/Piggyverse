import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { marketId, outcomeId } = body;

        if (!marketId || !outcomeId) {
            return NextResponse.json(
                { error: "Missing marketId or outcomeId" },
                { status: 400 }
            );
        }

        // Fetch market to check permissions and status
        const market = await prisma.bettingMarket.findUnique({
            where: { id: marketId },
            include: {
                tournament: {
                    select: { hostId: true }
                },
                outcomes: true
            }
        });

        if (!market) {
            return NextResponse.json({ error: "Market not found" }, { status: 404 });
        }

        // Check if user is host
        if (market.tournament.hostId !== session.user.id) {
            return NextResponse.json({ error: "Only the tournament host can resolve markets" }, { status: 403 });
        }

        // Check if market is already resolved
        if (market.status === 'SETTLED') {
            return NextResponse.json({ error: "Market is already resolved" }, { status: 400 });
        }

        // Check if outcome exists in this market
        const winningOutcome = market.outcomes.find(o => o.id === outcomeId);
        if (!winningOutcome) {
            return NextResponse.json({ error: "Invalid outcome for this market" }, { status: 400 });
        }

        // Resolve Market
        // 1. Mark market as RESOLVED
        // 2. Mark winning outcome
        // 3. Mark losing outcomes
        // Note: Actual payout distribution logic would typically be triggered here or via a separate job.
        // For this MVP phase, we just mark the status.

        // Transaction to update everything
        const resolvedMarket = await prisma.$transaction(async (tx) => {
            // 1. Update Market Status
            const updatedMarket = await tx.bettingMarket.update({
                where: { id: marketId },
                data: {
                    status: 'SETTLED',
                    winningOutcomeId: outcomeId
                }
            });

            // 2. Mark Winning Bets
            await tx.bet.updateMany({
                where: {
                    marketId: marketId,
                    outcomeId: outcomeId,
                    status: 'CONFIRMED'
                },
                data: {
                    status: 'WON'
                }
            });

            // 3. Mark Losing Bets
            await tx.bet.updateMany({
                where: {
                    marketId: marketId,
                    outcomeId: { not: outcomeId },
                    status: 'CONFIRMED'
                },
                data: {
                    status: 'LOST',
                    payoutAmount: 0
                }
            });

            return updatedMarket;
        });

        return NextResponse.json(resolvedMarket);

    } catch (error) {
        console.error("Error resolving market:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
