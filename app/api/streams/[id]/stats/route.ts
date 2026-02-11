
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: streamId } = await params;

    try {
        const stream = await prisma.stream.findUnique({
            where: { id: streamId },
            select: { viewerCount: true, status: true }
        });

        if (!stream) {
            return NextResponse.json({ error: "Stream not found" }, { status: 404 });
        }

        return NextResponse.json({
            viewerCount: stream.viewerCount,
            status: stream.status
        });

    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}
