import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { incrementTournamentsHosted, incrementMarketsCreated } from "@/lib/stats";
import { extractPokerNowTableId, extractPokerNowTournamentId, isPokerNowUrl } from "@/lib/utils/pokernow";

/**
 * Extract PokerNow metadata from lobby URL
 */
function extractPokerNowMetadata(lobbyUrl: string) {
    if (!isPokerNowUrl(lobbyUrl)) return undefined;

    const tableId = extractPokerNowTableId(lobbyUrl);
    const tournamentId = extractPokerNowTournamentId(lobbyUrl);

    return {
        pokerNowTableId: tableId,
        pokerNowTournamentId: tournamentId,
        lobbyPlatform: 'pokernow',
    };
}

// GET /api/tournaments - Get all tournaments with filters
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");
        const gameId = searchParams.get("gameId");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "12");

        const where: any = {};

        if (status) {
            if (status.includes(",")) {
                where.status = { in: status.split(",") };
            } else {
                where.status = status;
            }
        }

        if (gameId) {
            where.gameId = gameId;
        }

        const [tournaments, total] = await Promise.all([
            prisma.tournament.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    game: {
                        select: {
                            id: true,
                            title: true,
                            thumbnailUrl: true,
                        },
                    },
                    host: {
                        select: {
                            id: true,
                            username: true,
                            avatarUrl: true,
                        },
                    },
                    bettingMarkets: {
                        select: {
                            id: true,
                            marketType: true,
                            totalPool: true,
                            status: true,
                            marketQuestion: true, // Also nice to have
                            isAutonomous: true,
                            outcomes: {
                                select: {
                                    id: true,
                                    label: true,
                                    weight: true
                                }
                            }
                        },
                    },
                },
                orderBy: {
                    startDate: "desc",
                },
            }),
            prisma.tournament.count({ where }),
        ]);

        // -----------------------------------------------------------------------
        // --- AUTO-ACTIVATE TOURNAMENTS (Listing Lag Fix) ---
        const now = new Date();
        const updatedTournaments = await Promise.all(tournaments.map(async (t) => {
            const startBoundary = t.registrationDeadline
                ? new Date(t.registrationDeadline)
                : new Date(t.startDate);

            if (t.status === 'PENDING' && now >= startBoundary) {
                console.log(`[Lazy-Activate] Marking tournament ${t.id} as ACTIVE in list view.`);
                // Update DB Status
                try {
                    const updated = await prisma.tournament.update({
                        where: { id: t.id },
                        data: { status: 'ACTIVE' },
                        include: {
                            game: { select: { id: true, title: true, thumbnailUrl: true } },
                            host: { select: { id: true, username: true, avatarUrl: true } },
                            bettingMarkets: {
                                select: {
                                    id: true, marketType: true, totalPool: true, status: true, marketQuestion: true, isAutonomous: true,
                                    outcomes: { select: { id: true, label: true, weight: true } }
                                }
                            }
                        }
                    });

                    // Trigger worker if autonomous
                    if (updated.bettingMarkets.some(m => m.isAutonomous)) {
                        const { autonomousOddsWorker } = await import('@/lib/betting/autonomous-odds-worker');
                        autonomousOddsWorker.start();
                    }

                    return updated;
                } catch (e) {
                    console.error(`[Lazy-Activate] Failed to update tournament ${t.id}`, e);
                    return t;
                }
            }
            return t;
        }));

        // --- ODDS CALCULATION: Compute live odds for betting markets ---
        const { calculateOdds } = await import('@/lib/betting');

        const tournamentsWithLivePool = updatedTournaments.map(t => {
            const prizePoolAmount = (t.prizePoolSeed || 0) + (t.registeredPlayers * (t.entryFeeAmount || 0));

            // Enhance betting markets with calculated odds
            const bettingMarkets = t.bettingMarkets.map((m: any) => {
                const outcomes = m.outcomes.map((o: any) => ({
                    ...o,
                    currentOdds: calculateOdds(m.marketType, m.totalPool, o.weight, m.outcomes)
                }));
                return { ...m, outcomes };
            });

            return {
                ...t,
                prizePoolAmount,
                bettingMarkets
            };
        });

        return NextResponse.json({
            tournaments: tournamentsWithLivePool,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Error fetching tournaments:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST /api/tournaments - Create a new tournament
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const {
            name,
            description,
            gameId,
            gameMode,
            region,
            platforms,
            maxPlayers,
            startDate,
            startTime,
            isIncentivized,
            entryFeeAmount,
            entryFeeToken,
            prizePoolAmount,
            prizePoolToken,
            prizeDistribution,
            rules,
            imageUrl,
            isPrivate,
            isStreamed,
            streamLink,
            discordLink,
            lobbyUrl,
            allowBetting,
            bettingMarkets,
            inviteCodes,
            registrationDeadline,
        } = body;

        if (!name || !gameId || !maxPlayers || !startDate || !startTime) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const tournament = await prisma.tournament.create({
            data: {
                name,
                description,
                gameId,
                gameMode,
                region,
                platforms: platforms || [],
                hostId: session.user.id,
                maxPlayers,
                startDate: new Date(startDate),
                startTime,
                registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : null,
                isIncentivized: isIncentivized || false,
                entryFeeAmount,
                entryFeeToken,
                prizePoolAmount: prizePoolAmount || 0,
                prizePoolSeed: prizePoolAmount || 0,
                prizePoolToken,
                prizeDistribution,
                rules,
                imageUrl,
                isPrivate: isPrivate || false,
                isStreamed: isStreamed || false,
                streamLink,
                discordLink,
                lobbyUrl,
                allowBetting: allowBetting || false,
                inviteCodes: inviteCodes && inviteCodes.length > 0 ? {
                    create: inviteCodes.map((code: string) => ({ code }))
                } : undefined,
                // Auto-extract PokerNow IDs from lobby URL
                metadata: lobbyUrl ? extractPokerNowMetadata(lobbyUrl) : undefined,
            },
            include: {
                game: {
                    select: {
                        id: true,
                        title: true,
                        thumbnailUrl: true,
                    },
                },
                host: {
                    select: {
                        id: true,
                        username: true,
                        avatarUrl: true,
                    },
                },
            },
        });

        // If betting is enabled, create betting markets
        if (allowBetting && bettingMarkets && Array.isArray(bettingMarkets)) {
            for (const marketConfig of bettingMarkets) {
                const market = await prisma.bettingMarket.create({
                    data: {
                        tournamentId: tournament.id,
                        marketType: marketConfig.marketType.toUpperCase(),
                        marketQuestion: marketConfig.marketQuestion,
                        poolPreSeed: Number(marketConfig.poolPreSeed) || 0,
                        poolPreSeedToken: marketConfig.poolPreSeedToken,
                        minBet: Number(marketConfig.minBet) || 0,
                        maxBet: marketConfig.maxBet ? Number(marketConfig.maxBet) : null,
                        bookmakingFee: Number(marketConfig.bookMakingFee) || 0,
                        resolutionSource: marketConfig.resolutionSource || "MANUAL",
                    },
                });

                // Create outcomes
                if (marketConfig.marketType === "binary") {
                    await prisma.bettingOutcome.createMany({
                        data: [
                            { marketId: market.id, label: "Yes", weight: 1 },
                            { marketId: market.id, label: "No", weight: 1 },
                        ],
                    });
                } else if (marketConfig.outcomes && marketConfig.outcomes.length > 0) {
                    await prisma.bettingOutcome.createMany({
                        data: marketConfig.outcomes.map((outcome: any) => ({
                            marketId: market.id,
                            label: outcome.label,
                            weight: Number(outcome.weight) || 0,
                        })),
                    });
                }
            }
        }

        // Update Host Stats & Rank using centralized utility
        await incrementTournamentsHosted(session.user.id);

        // Track market creation stats if applicable
        if (allowBetting && bettingMarkets?.length > 0) {
            await incrementMarketsCreated(session.user.id, bettingMarkets.length);
        }

        return NextResponse.json(tournament, { status: 201 });
    } catch (error) {
        console.error("Error creating tournament:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
