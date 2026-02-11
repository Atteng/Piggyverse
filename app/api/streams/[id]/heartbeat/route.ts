
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    const { id: streamId } = await params;

    if (!session || !session.user) {
        // For anonymous users, we just return the current count (or implement guest tracking later)
        // For now, returning current count
        const stream = await prisma.stream.findUnique({
            where: { id: streamId },
            select: { viewerCount: true }
        });
        return NextResponse.json({ viewerCount: stream?.viewerCount || 0 });
    }

    try {
        // Update or Create WatchSession
        // We use a simplified logic: if session exists for today/stream, update it.
        // Actually, schema has `WatchSession` linked to user/stream.

        // Find active session
        const activeSession = await prisma.watchSession.findFirst({
            where: {
                userId: session.user.id,
                streamId: streamId,
                // Consider it the same session if started within last 24h?
                startedAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
            },
            orderBy: { startedAt: 'desc' }
        });

        if (activeSession) {
            await prisma.watchSession.update({
                where: { id: activeSession.id },
                data: {
                    lastPing: new Date(),
                    watchTimeSeconds: { increment: 30 } // Assume 30s heartbeat
                }
            });
        } else {
            await prisma.watchSession.create({
                data: {
                    userId: session.user.id,
                    streamId: streamId,
                    lastPing: new Date(),
                }
            });
        }

        // Calculate Viewer Count (Active users in last 2 minutes)
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
        const activeCount = await prisma.watchSession.count({
            where: {
                streamId: streamId,
                lastPing: { gt: twoMinutesAgo }
            }
        });

        // Update Stream Viewer Count
        try {
            await prisma.stream.update({
                where: { id: streamId },
                data: { viewerCount: activeCount }
            });
        } catch (updateError: any) {
            // P2025: Record to update not found. Stream might have been deleted.
            if (updateError.code !== 'P2025') {
                console.error("Failed to update stream viewer count:", updateError);
            }
        }

        return NextResponse.json({
            viewerCount: activeCount,
            pointsEarned: activeSession ? Math.floor((activeSession.watchTimeSeconds + 30) / 60) : 0
        });

    } catch (error) {
        console.error("Heartbeat error:", error);
        return NextResponse.json({ error: "Failed to process heartbeat" }, { status: 500 });
    }
}
