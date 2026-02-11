import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NotificationType } from "@prisma/client";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Filter by type if provided
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    try {
        const whereClause: any = {
            userId: session.user.id,
        };

        if (type && type !== "all") {
            // Map frontend type (lowercase) to Prisma enum (UPPERCASE)
            whereClause.type = type.toUpperCase() as NotificationType;
        }

        const notifications = await prisma.notification.findMany({
            where: whereClause,
            orderBy: {
                createdAt: "desc",
            },
            take: 50, // Limit to recent 50
        });

        // Map Prisma result to frontend interface
        const formattedNotifications = notifications.map(n => ({
            id: n.id,
            type: n.type.toLowerCase(),
            title: n.title,
            message: n.message,
            timestamp: n.createdAt.toISOString(),
            read: n.isRead,
            actionLabel: n.actionLabel,
            actionUrl: n.actionUrl,
            amount: n.amount,
        }));

        return NextResponse.json({
            notifications: formattedNotifications,
        });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// Mark as read endpoint
export async function PATCH(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { id, markAll } = body;

        if (markAll) {
            await prisma.notification.updateMany({
                where: {
                    userId: session.user.id,
                    isRead: false,
                },
                data: {
                    isRead: true,
                },
            });
        } else if (id) {
            await prisma.notification.update({
                where: {
                    id: id,
                    userId: session.user.id, // Ensure ownership
                },
                data: {
                    isRead: true,
                },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating notifications:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
