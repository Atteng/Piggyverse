
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: gameId } = await params;

    try {
        await prisma.game.update({
            where: { id: gameId },
            data: { playerCount: { increment: 1 } }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to track game play:", error);
        return NextResponse.json({ error: "Failed to track play" }, { status: 500 });
    }
}
