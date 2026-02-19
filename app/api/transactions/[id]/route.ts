import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/transactions/[id] - Get transaction receipt
export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: (session.user as any).id }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Try to find the transaction in different tables
        let transaction: any = null;
        let type: string = '';

        // Check bets
        const bet = await prisma.bet.findFirst({
            where: {
                id: params.id,
                userId: user.id
            },
            include: {
                market: {
                    include: {
                        tournament: {
                            select: {
                                name: true
                            }
                        }
                    }
                },
                outcome: {
                    select: {
                        label: true
                    }
                }
            }
        });

        if (bet) {
            transaction = {
                id: bet.id,
                type: 'BET',
                amount: bet.amount,
                token: bet.token,
                status: bet.status,
                txHash: bet.txHash,
                createdAt: bet.placedAt,
                details: {
                    tournament: bet.market.tournament.name,
                    outcome: bet.outcome.label,
                    odds: 0, // Odds not stored in Bet model
                    potentialPayout: bet.payoutAmount
                }
            };
        }

        // Check watch sessions (Temporarily disabled due to schema mismatch)
        /*
        if (!transaction) {
            const watchSession = await prisma.watchSession.findFirst({
                where: {
                    id: params.id,
                    userId: user.id,
                    // claimed: true // Schema missing claimed
                }
            });

            if (watchSession) {
                transaction = {
                    id: watchSession.id,
                    type: 'WATCH_REWARD',
                    amount: watchSession.effortPointsEarned,
                    token: 'PIGGY',
                    status: 'CONFIRMED',
                    // txHash: watchSession.claimTxHash, // Schema missing txHash
                    createdAt: watchSession.startedAt,
                    details: {
                        duration: 0,
                        streamId: watchSession.streamId
                    }
                };
            }
        }
        */

        if (!transaction) {
            return NextResponse.json(
                { error: 'Transaction not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            receipt: transaction,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Error fetching transaction receipt:', error);
        return NextResponse.json(
            { error: 'Failed to fetch receipt' },
            { status: 500 }
        );
    }
}
