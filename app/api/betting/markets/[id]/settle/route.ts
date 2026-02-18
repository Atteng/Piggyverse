import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

import { settleMarket } from '@/lib/betting/settlement';

// POST /api/betting/markets/[id]/settle - Settle a betting market (Admin only)
export async function POST(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const body = await request.json();
        const { winningOutcomeId, settlementData } = body;

        if (!winningOutcomeId) {
            return NextResponse.json(
                { error: 'Winning outcome ID is required' },
                { status: 400 }
            );
        }

        // Fetch market to check permissions
        const market = await prisma.bettingMarket.findUnique({
            where: { id: params.id },
            include: {
                tournament: {
                    include: { host: true }
                },
                outcomes: true
            }
        });

        if (!market) {
            return NextResponse.json(
                { error: 'Betting market not found' },
                { status: 404 }
            );
        }

        // Only tournament host can settle
        if (market.tournament.host.email !== session.user.email) {
            return NextResponse.json(
                { error: 'Only tournament host can settle markets' },
                { status: 403 }
            );
        }

        // Use the centralized settlement utility
        const result = await settleMarket(params.id, winningOutcomeId, settlementData);

        const winningOutcome = market.outcomes.find(o => o.id === winningOutcomeId);

        // Create notifications for winners
        // Note: settlement utility returns payouts formatted as needed
        if (result.settlementData?.payouts) {
            await Promise.all(
                result.settlementData.payouts.map(async (p: any) => {
                    if (p.amount > 0) {
                        // Find user for this bet - we need to query the bet to get userId
                        const bet = await prisma.bet.findUnique({ where: { id: p.betId } });
                        if (bet) {
                            await prisma.notification.create({
                                data: {
                                    userId: bet.userId,
                                    type: 'EARNING',
                                    title: 'Bet Won!',
                                    message: `You won ${p.amount.toFixed(2)} ${market.poolPreSeedToken || 'USDC'} from your bet on ${market.tournament.name}`,
                                    actionUrl: `/competitive-hub/${market.tournament.id}`,
                                    actionLabel: 'View Tournament',
                                    amount: p.amount
                                }
                            });
                        }
                    }
                })
            );
        }

        return NextResponse.json({
            success: true,
            winningOutcome: winningOutcome?.label,
            totalPayout: result.totalPaidOut,
            winnersCount: result.betsUpdated,
            result
        });
    } catch (error: any) {
        console.error('Error settling market:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to settle market' },
            { status: 500 }
        );
    }
}
