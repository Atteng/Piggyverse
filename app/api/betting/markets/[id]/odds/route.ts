import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/betting/markets/[id]/odds - Get live odds for a market
export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const market = await prisma.bettingMarket.findUnique({
            where: { id: params.id },
            include: {
                outcomes: {
                    orderBy: { label: 'asc' }
                }
            }
        });

        if (!market) {
            return NextResponse.json(
                { error: 'Market not found' },
                { status: 404 }
            );
        }

        // Calculate current odds for each outcome
        const outcomesWithOdds = market.outcomes.map(outcome => {
            let odds = 1.0;

            if (market.marketType === 'PARIMUTUEL') {
                const netPool = (market.totalPool + market.poolPreSeed) * (1 - market.bookmakingFee / 100);
                odds = outcome.totalBets > 0 ? netPool / outcome.totalBets : 0;
            } else if (market.marketType === 'WEIGHTED') {
                odds = outcome.weight || 1.0;
            } else if (market.marketType === 'BINARY') {
                odds = 2.0;
            } else if (market.marketType === 'SCORE') {
                const totalBets = market.outcomes.reduce((sum, o) => sum + o.totalBets, 0);
                odds = totalBets > 0 ? totalBets / (outcome.totalBets || 1) : 1.0;
            }

            return {
                outcomeId: outcome.id,
                label: outcome.label,
                currentOdds: Math.max(odds, 1.0),
                totalBets: outcome.totalBets,
                betCount: outcome.betCount
            };
        });

        return NextResponse.json({ outcomes: outcomesWithOdds });
    } catch (error) {
        console.error('Error fetching odds:', error);
        return NextResponse.json(
            { error: 'Failed to fetch odds' },
            { status: 500 }
        );
    }
}
