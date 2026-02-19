import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateBookingCode } from '@/lib/betting/booking-codes';
import { getOutcomeOdds, updateMarketWeights } from '@/lib/betting/odds-engine';

// GET /api/betting/bets?userId=xxx - Get user's bets
export async function GET(request: NextRequest) {
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

        const bets = await prisma.bet.findMany({
            where: { userId: user.id },
            include: {
                market: {
                    include: {
                        tournament: {
                            select: {
                                name: true,
                                startDate: true,
                                status: true
                            }
                        }
                    }
                },
                outcome: {
                    select: {
                        label: true
                    }
                }
            },
            orderBy: { placedAt: 'desc' }
        });

        return NextResponse.json(bets);
    } catch (error) {
        console.error('Error fetching bets:', error);
        return NextResponse.json(
            { error: 'Failed to fetch bets' },
            { status: 500 }
        );
    }
}

// POST /api/betting/bets - Place a bet
export async function POST(request: NextRequest) {
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

        const body = await request.json();
        const { marketId, outcomeId, amount, token, minOdds } = body;

        // Validate required fields
        if (!marketId || !outcomeId || !amount || !token) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Fetch market to validate
        // Cast to any because isAutonomous is missing from Prisma type but exists in DB
        const market = await prisma.bettingMarket.findUnique({
            where: { id: marketId },
            include: {
                outcomes: true,
                tournament: true
            }
        });

        if (!market) {
            return NextResponse.json(
                { error: 'Betting market not found' },
                { status: 404 }
            );
        }

        // Check if market is open
        if (market.status !== 'OPEN') {
            return NextResponse.json(
                { error: 'Betting market is closed' },
                { status: 400 }
            );
        }

        // Validate bet amount
        if (amount < market.minBet) {
            return NextResponse.json(
                { error: `Minimum bet is ${market.minBet} ${token}` },
                { status: 400 }
            );
        }

        if (market.maxBet && amount > market.maxBet) {
            return NextResponse.json(
                { error: `Maximum bet is ${market.maxBet} ${token}` },
                { status: 400 }
            );
        }

        // Validate outcome exists
        const outcome = market.outcomes.find(o => o.id === outcomeId);
        if (!outcome) {
            return NextResponse.json(
                { error: 'Invalid outcome' },
                { status: 400 }
            );
        }

        // Phase 1: Capture odds at placement
        // If market is autonomous, use calculated odds. Else use host-set weight.
        let oddsAtPlacement: number | null = null;
        if ((market as any).isAutonomous) {
            try {
                oddsAtPlacement = await getOutcomeOdds(marketId, outcomeId);
            } catch (e) {
                console.error("Failed to calculate odds at placement", e);
                // Fallback to current weight if engine fails
                oddsAtPlacement = outcome.weight || 1.0;
            }
        } else {
            oddsAtPlacement = outcome.weight;
        }

        // Validate Slippage Protection
        if (minOdds !== undefined && minOdds !== null) {
            const currentOdds = oddsAtPlacement || 0; // Treat null as 0 for safety
            if (currentOdds < minOdds) {
                return NextResponse.json(
                    {
                        error: `Odds changed to ${currentOdds.toFixed(2)} (Min: ${minOdds.toFixed(2)})`,
                        code: 'SLIPPAGE'
                    },
                    { status: 409 }
                );
            }
        }

        // Create bet (PENDING status - waiting for blockchain confirmation)
        const bet = await prisma.bet.create({
            data: {
                marketId,
                outcomeId,
                userId: user.id,
                amount,
                token,
                status: 'PENDING',
                bookingCode: generateBookingCode(),
                oddsAtPlacement // Store the locked odds
            },
            include: {
                outcome: true,
                market: {
                    include: {
                        tournament: true
                    }
                }
            }
        });

        // Update outcome totals (optimistic - will be confirmed by indexer)
        await prisma.bettingOutcome.update({
            where: { id: outcomeId },
            data: {
                totalBets: { increment: amount },
                betCount: { increment: 1 }
            }
        });

        // Update market total pool
        await prisma.bettingMarket.update({
            where: { id: marketId },
            data: {
                totalPool: { increment: amount }
            }
        });

        // Phase 1: Trigger odds recalculation for autonomous markets
        // We do this *after* the pool update so the next user sees the impact of this bet.
        // No await here to avoid slowing down the response.
        if ((market as any).isAutonomous) {
            updateMarketWeights(marketId).catch(console.error);
        }

        // Create notification
        await prisma.notification.create({
            data: {
                userId: user.id,
                type: 'EARNING',
                title: 'Bet Placed',
                message: `You placed a bet of ${amount} ${token} on "${outcome.label}" for ${market.tournament.name}`,
                actionUrl: `/competitive-hub/${market.tournament.id}`,
                amount: amount
            }
        });

        return NextResponse.json(bet, { status: 201 });
    } catch (error) {
        console.error('Error placing bet:', error);
        return NextResponse.json(
            { error: 'Failed to place bet' },
            { status: 500 }
        );
    }
}
