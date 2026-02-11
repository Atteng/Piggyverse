import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        // Try to fetch from database first
        const stream = await prisma.stream.findFirst({
            where: {
                isLive: true,
            },
            orderBy: {
                viewerCount: 'desc',
            },
        });

        if (stream) {
            return NextResponse.json({
                id: stream.id,
                title: stream.title,
                viewerCount: stream.viewerCount,
                platform: stream.platform.toLowerCase(),
                channelName: stream.channelName,
                isLive: stream.isLive,
                thumbnailUrl: stream.thumbnailUrl,
                startedAt: stream.actualStart?.toISOString(),
            });
        }

        // If no live stream in database, return null (offline state)
        return NextResponse.json(null);
    } catch (error) {
        console.error("Error fetching active stream:", error);
        return NextResponse.json(null); // Return null on error instead of mock
    }
}
