import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
                        },
                    },
                },
                orderBy: {
                    startDate: "desc",
                },
            }),
            prisma.tournament.count({ where }),
        ]);

        return NextResponse.json({
            tournaments,
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
            allowBetting,
            bettingMarkets,
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
                isIncentivized: isIncentivized || false,
                entryFeeAmount,
                entryFeeToken,
                prizePoolAmount,
                prizePoolToken,
                prizeDistribution,
                rules,
                imageUrl,
                isPrivate: isPrivate || false,
                isStreamed: isStreamed || false,
                streamLink,
                allowBetting: allowBetting || false,
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

        // Update Host Stats
        await prisma.userStats.upsert({
            where: { userId: session.user.id },
            update: {
                tournamentsHosted: { increment: 1 },
                lastActivity: new Date(),
            },
            create: {
                userId: session.user.id,
                tournamentsHosted: 1,
                lastActivity: new Date(),
            }
        });

        // Update User Activity Score
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                activityScore: { increment: 50 }
            }
        });

        // Update / Create Global Leaderboard Entry
        const lbEntry = await prisma.leaderboardEntry.findFirst({
            where: { userId: session.user.id, gameId: null }
        });

        if (lbEntry) {
            await prisma.leaderboardEntry.update({
                where: { id: lbEntry.id },
                data: {
                    totalScore: { increment: 50 },
                }
            });
        } else {
            await prisma.leaderboardEntry.create({
                data: {
                    userId: session.user.id,
                    gameId: null,
                    rank: 999,
                    totalScore: 50,
                    tournamentsWon: 0,
                    timePlayedHours: 0,
                    matchWins: 0
                }
            });
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
