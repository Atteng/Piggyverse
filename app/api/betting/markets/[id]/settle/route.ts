import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
        const { winningOutcomeId } = body;

        if (!winningOutcomeId) {
            return NextResponse.json(
                { error: 'Winning outcome ID is required' },
                { status: 400 }
            );
        }

        // Fetch market
        const market = await prisma.bettingMarket.findUnique({
            where: { id: params.id },
            include: {
                outcomes: true,
                bets: {
                    include: {
                        user: true,
                        outcome: true
                    }
                },
                tournament: {
                    include: {
                        host: true
                    }
                }
            }
        });

        if (!market) {
            return NextResponse.json(
                { error: 'Betting market not found' },
                { status: 404 }
            );
        }

        // Only tournament host can settle (in production, this would be admin-only)
        if (market.tournament.host.email !== session.user.email) {
            return NextResponse.json(
                { error: 'Only tournament host can settle markets' },
                { status: 403 }
            );
        }

        // Validate winning outcome
        const winningOutcome = market.outcomes.find(o => o.id === winningOutcomeId);
        if (!winningOutcome) {
            return NextResponse.json(
                { error: 'Invalid winning outcome' },
                { status: 400 }
            );
        }

        // Calculate payouts
        const netPool = (market.totalPool + market.poolPreSeed) * (1 - market.bookmakingFee / 100);
        const winningBets = market.bets.filter(bet => bet.outcomeId === winningOutcomeId);

        // Settlement formula: (Bet Amount / Total on Outcome) × Net Pool
        const payouts = winningBets.map(bet => {
            const payout = (bet.amount / winningOutcome.totalBets) * netPool;
            return {
                betId: bet.id,
                userId: bet.userId,
                payout: Math.floor(payout * 100) / 100 // Round to 2 decimals
            };
        });

        // Update all bets
        await Promise.all([
            // Mark winning bets
            ...winningBets.map(bet => {
                const payout = payouts.find(p => p.betId === bet.id)?.payout || 0;
                return prisma.bet.update({
                    where: { id: bet.id },
                    data: {
                        status: 'WON',
                        payoutAmount: payout
                    }
                });
            }),
            // Mark losing bets
            ...market.bets
                .filter(bet => bet.outcomeId !== winningOutcomeId)
                .map(bet =>
                    prisma.bet.update({
                        where: { id: bet.id },
                        data: {
                            status: 'LOST',
                            payoutAmount: 0
                        }
                    })
                )
        ]);

        // Update market status
        await prisma.bettingMarket.update({
            where: { id: params.id },
            data: { status: 'SETTLED' }
        });

        // Create notifications for winners
        await Promise.all(
            payouts.map(({ userId, payout }) =>
                prisma.notification.create({
                    data: {
                        userId,
                        type: 'EARNING',
                        title: 'Bet Won!',
                        message: `You won ${payout} ${market.poolPreSeedToken || 'USDC'} from your bet on ${market.tournament.name}`,
                        actionUrl: `/competitive-hub/${market.tournament.id}`,
                        actionLabel: 'View Tournament',
                        amount: payout
                    }
                })
            )
        );

        return NextResponse.json({
            success: true,
            winningOutcome: winningOutcome.label,
            totalPayout: netPool,
            winnersCount: winningBets.length,
            payouts
        });
    } catch (error) {
        console.error('Error settling market:', error);
        return NextResponse.json(
            { error: 'Failed to settle market' },
            { status: 500 }
        );
    }
}
