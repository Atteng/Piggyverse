import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { MarketType } from '@prisma/client';

// GET /api/betting/markets?tournamentId=xxx
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const tournamentId = searchParams.get('tournamentId');

        if (!tournamentId) {
            return NextResponse.json(
                { error: 'Tournament ID is required' },
                { status: 400 }
            );
        }

        const markets = await prisma.bettingMarket.findMany({
            where: { tournamentId },
            include: {
                outcomes: {
                    orderBy: { label: 'asc' }
                },
                tournament: {
                    select: {
                        name: true,
                        startDate: true,
                        status: true
                    }
                }
            }
        });

        if (!markets || markets.length === 0) {
            return NextResponse.json({ markets: [] });
        }

        // Calculate current odds for each outcome in each market
        const { calculateCurrentOdds } = await import('@/lib/betting');
        const marketsWithOdds = markets.map(market => {
            const outcomesWithOdds = market.outcomes.map(outcome => ({
                ...outcome,
                currentOdds: calculateCurrentOdds(market, outcome)
            }));

            return {
                ...market,
                outcomes: outcomesWithOdds
            };
        });

        return NextResponse.json({
            markets: marketsWithOdds
        });
    } catch (error) {
        console.error('Error fetching betting market:', error);
        return NextResponse.json(
            { error: 'Failed to fetch betting market' },
            { status: 500 }
        );
    }
}

// POST /api/betting/markets - Create a betting market
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            tournamentId,
            marketType,
            marketQuestion,
            poolPreSeed,
            poolPreSeedToken,
            minBet,
            maxBet,
            bookmakingFee,
            outcomes
        } = body;

        // Validate required fields
        if (!tournamentId || !marketType || !marketQuestion || !outcomes || outcomes.length === 0) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Check if tournament exists and user is the host
        const tournament = await prisma.tournament.findUnique({
            where: { id: tournamentId },
            include: { host: true }
        });

        if (!tournament) {
            return NextResponse.json(
                { error: 'Tournament not found' },
                { status: 404 }
            );
        }

        if (tournament.host.email !== session.user.email) {
            return NextResponse.json(
                { error: 'Only tournament host can create betting markets' },
                { status: 403 }
            );
        }

        // Create market with outcomes
        const market = await prisma.bettingMarket.create({
            data: {
                tournamentId,
                marketType: marketType as MarketType,
                marketQuestion,
                poolPreSeed: poolPreSeed || 0,
                poolPreSeedToken: poolPreSeedToken || 'USDC',
                minBet: minBet || 0,
                maxBet: maxBet,
                bookmakingFee: bookmakingFee || 0,
                outcomes: {
                    create: outcomes.map((outcome: any) => ({
                        label: outcome.label,
                        weight: outcome.weight
                    }))
                }
            },
            include: {
                outcomes: true
            }
        });

        // Update stats via centralized utility
        const { incrementMarketsCreated } = await import('@/lib/stats');
        await incrementMarketsCreated(tournament.hostId, 1);

        return NextResponse.json(market, { status: 201 });
    } catch (error) {
        console.error('Error creating betting market:', error);
        return NextResponse.json(
            { error: 'Failed to create betting market' },
            { status: 500 }
        );
    }
}
