import { NextRequest, NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // TODO: specific admin check
        // if (session.user.role !== 'ADMIN') return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");

        const where: any = {};
        if (status && status !== 'ALL') {
            where.status = status;
        }

        const bets = await prisma.bet.findMany({
            where,
            include: {
                user: {
                    select: {
                        username: true,
                        avatarUrl: true,
                    }
                },
                market: {
                    include: {
                        tournament: {
                            select: {
                                name: true
                            }
                        }
                    }
                },
                outcome: true
            },
            orderBy: {
                placedAt: 'desc'
            },
            take: 100 // Limit for safety
        });

        return NextResponse.json(bets);
    } catch (error) {
        console.error("Error fetching admin bets:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
