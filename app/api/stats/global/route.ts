import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const [
            usersCount,
            tournamentsCount,
            activeTournamentsCount,
            totalBetsCount,
            totalVolumeResult
        ] = await Promise.all([
            prisma.user.count(),
            prisma.tournament.count(),
            prisma.tournament.count({ where: { status: 'ACTIVE' } }),
            prisma.bet.count(),
            prisma.bet.aggregate({
                _sum: {
                    amount: true
                }
            })
        ]);

        // Volume is a float, usually
        const totalVolume = totalVolumeResult._sum.amount || 0;

        return NextResponse.json({
            users: usersCount,
            tournaments: tournamentsCount,
            activeTournaments: activeTournamentsCount,
            totalBets: totalBetsCount,
            totalVolume: totalVolume
        });
    } catch (error) {
        console.error("Error fetching global stats:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
