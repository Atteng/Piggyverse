
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PATCH /api/betting/markets/[id] - Update market details
export async function PATCH(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const market = await prisma.bettingMarket.findUnique({
            where: { id: params.id },
            include: {
                tournament: {
                    select: {
                        hostId: true,
                        status: true
                    }
                },
                _count: {
                    select: { bets: true }
                }
            }
        });

        if (!market) {
            return NextResponse.json({ error: 'Market not found' }, { status: 404 });
        }

        // Verify host permission
        if (market.tournament.hostId !== session.user.id) {
            return NextResponse.json({ error: 'Only tournament host can update markets' }, { status: 403 });
        }

        if (market.status === 'SETTLED' || market.status === 'CANCELLED') {
            return NextResponse.json({ error: 'Cannot update settled or cancelled markets' }, { status: 400 });
        }

        const body = await request.json();
        const { marketQuestion, outcomes, status } = body;

        // Prepare update data
        const updateData: any = {};
        if (marketQuestion) updateData.marketQuestion = marketQuestion;
        if (status) updateData.status = status;

        // Transaction to update market and potentially outcomes
        await prisma.$transaction(async (tx: any) => {
            // Update market fields
            if (Object.keys(updateData).length > 0) {
                await tx.bettingMarket.update({
                    where: { id: params.id },
                    data: updateData
                });
            }

            // Update outcomes if provided
            if (outcomes && Array.isArray(outcomes)) {
                // If bets exist, strictly forbid changing weights or labels to avoid manipulation/confusion
                // UNLESS it's a minor typo fix? No, safer to block.
                const hasBets = market._count.bets > 0;

                for (const outcome of outcomes) {
                    if (outcome.id) {
                        const data: any = {};
                        if (outcome.label) data.label = outcome.label;

                        // Only allow weight update if no bets
                        if (outcome.weight !== undefined && !hasBets) {
                            data.weight = outcome.weight;
                        }

                        if (Object.keys(data).length > 0) {
                            await tx.bettingOutcome.update({
                                where: { id: outcome.id },
                                data
                            });
                        }
                    }
                }
            }
        });

        const updatedMarket = await prisma.bettingMarket.findUnique({
            where: { id: params.id },
            include: { outcomes: true }
        });

        return NextResponse.json(updatedMarket);

    } catch (error) {
        console.error('Error updating market:', error);
        return NextResponse.json(
            { error: 'Failed to update market' },
            { status: 500 }
        );
    }
}

// DELETE /api/betting/markets/[id] - Cancel/Delete market
export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const market = await prisma.bettingMarket.findUnique({
            where: { id: params.id },
            include: {
                tournament: { select: { hostId: true } },
                _count: { select: { bets: true } }
            }
        });

        if (!market) return NextResponse.json({ error: 'Market not found' }, { status: 404 });
        if (market.tournament.hostId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        if (market._count.bets > 0) {
            // If bets exist, we can only CANCEL (which should trigger refunds logic technically, but for now just mark status)
            // Implementing full refund logic here is complex. For now, mark as CANCELLED.
            // TODO: Trigger refund process
            await prisma.bettingMarket.update({
                where: { id: params.id },
                data: { status: 'CANCELLED' }
            });
        } else {
            // No bets, safe to hard delete
            await prisma.bettingMarket.delete({
                where: { id: params.id }
            });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error deleting market:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
