import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/games - Get all games with optional filters
export const runtime = 'nodejs'; // Ensure node runtime for larger body limits if configured

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search");
        const category = searchParams.get("category");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "12");

        const where: any = {
            isListed: true,
        };

        if (search) {
            where.title = {
                contains: search,
                mode: "insensitive",
            };
        }

        if (category && category !== "all") {
            where.categories = {
                has: category,
            };
        }

        const [games, total] = await Promise.all([
            prisma.game.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    createdBy: {
                        select: {
                            id: true,
                            username: true,
                            avatarUrl: true,
                        },
                    },
                },
                orderBy: {
                    playerCount: "desc",
                },
            }),
            prisma.game.count({ where }),
        ]);

        return NextResponse.json({
            games,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Error fetching games:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST /api/games - Create a new game
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { title, description, thumbnailUrl, gameUrl, categories, platforms } = body;

        if (!title) {
            return NextResponse.json(
                { error: "Title is required" },
                { status: 400 }
            );
        }

        const game = await prisma.game.create({
            data: {
                title,
                description,
                thumbnailUrl,
                gameUrl,
                categories: categories || [],
                platforms: platforms || [],
                createdById: session.user.id,
            },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        username: true,
                        avatarUrl: true,
                    },
                },
            },
        });

        return NextResponse.json(game, { status: 201 });
    } catch (error) {
        console.error("Error creating game:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
