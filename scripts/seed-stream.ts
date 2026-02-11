import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding stream...");

    // Check if a live stream exists
    const existing = await prisma.stream.findFirst({
        where: { isLive: true }
    });

    if (existing) {
        console.log("Live stream already exists:", existing.title);
        return;
    }

    // Create a new stream
    const stream = await prisma.stream.create({
        data: {
            title: "PiggyVerse Live Launch 🚀",
            description: "Join us for the official launch event!",
            platform: "TWITCH",
            channelName: "piggydao",
            thumbnailUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2670&auto=format&fit=crop",
            isLive: true,
            isActive: true,
            isFeatured: true,
            viewerCount: 420,
            actualStart: new Date(),
        }
    });

    console.log("Created stream:", stream.title);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
