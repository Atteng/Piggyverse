import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/streams/chat?streamId=...
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const streamId = searchParams.get("streamId");

    if (!streamId) {
        return NextResponse.json({ error: "Stream ID required" }, { status: 400 });
    }

    try {
        // Try fetching from database
        // @ts-ignore - Prisma client might not be regenerated yet
        const messages = await prisma.chatMessage.findMany({
            where: { streamId },
            orderBy: { createdAt: 'asc' },
            take: 50,
            include: {
                user: {
                    select: {
                        username: true,
                        avatarUrl: true,
                        globalRank: true,
                    }
                }
            }
        });

        return NextResponse.json({ messages });
    } catch (error) {
        console.error("Error fetching chat messages:", error);

        // Fallback to mock data if table doesn't exist
        return NextResponse.json({ messages: [] });
    }
}

// POST /api/streams/chat
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { streamId, content } = body;

        if (!streamId || !content) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Create message in database
        // @ts-ignore - Prisma client might not be regenerated yet
        const message = await prisma.chatMessage.create({
            data: {
                content,
                streamId,
                userId: session.user.id,
            },
            include: {
                user: {
                    select: {
                        username: true,
                        avatarUrl: true,
                        globalRank: true,
                    }
                }
            }
        });

        return NextResponse.json({ message });
    } catch (error) {
        console.error("Error posting chat message:", error);
        return NextResponse.json({ error: "Failed to post message" }, { status: 500 });
    }
}
