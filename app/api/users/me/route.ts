import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/users/me - Get current user profile
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: {
                stats: true,
                accounts: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Compute connection status based on accounts existence
        // This validates the source of truth (Account table) instead of relying on potentially out-of-sync User fields
        const twitterAccount = user.accounts.find(a => a.provider === "twitter");
        const discordAccount = user.accounts.find(a => a.provider === "discord");

        const userWithStatus = {
            ...user,
            twitterConnected: !!twitterAccount,
            discordConnected: !!discordAccount,
            // If handles are missing but account exists, we might default to username if created via that provider
            // But for now, we rely on what's in the DB or just the connection status
        };

        return NextResponse.json(userWithStatus);
    } catch (error) {
        console.error("Error fetching user:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// PATCH /api/users/me - Update current user profile
export async function PATCH(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { username, avatarUrl } = body;

        const user = await prisma.user.update({
            where: { id: session.user.id },
            data: {
                ...(username && { username }),
                ...(avatarUrl && { avatarUrl }),
            },
            include: {
                stats: true,
            },
        });

        return NextResponse.json(user);
    } catch (error) {
        console.error("Error updating user:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
