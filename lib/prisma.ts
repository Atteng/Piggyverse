import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
    usingFallback: boolean;
};

const POOLER_URL = process.env.DATABASE_URL!;
const DIRECT_URL = process.env.DIRECT_DATABASE_URL || POOLER_URL.replace('pooler.supabase.com', 'connect.supabase.com');

// Initialize the client
// If the terminal logs showed P1001 frequently, we might want to prioritize DIRECT_URL 
// but the user wants a fallback.
let prismaInstance: PrismaClient;

if (process.env.NODE_ENV === 'production') {
    prismaInstance = new PrismaClient({
        datasources: { db: { url: POOLER_URL } },
    });
} else {
    if (!globalForPrisma.prisma) {
        // In development, we use a single instance to prevent hot-reloading from creating too many connections
        globalForPrisma.prisma = new PrismaClient({
            datasources: { db: { url: POOLER_URL } },
            log: ['error', 'warn'],
        });
    }
    prismaInstance = globalForPrisma.prisma;
}

/**
 * Fallback Logic:
 * If a query fails with a connection error (P1001), we can't easily "hot-swap" the exported prisma constant,
 * but we can provide this helper or rely on the user to restart if the pooler is permanently down.
 * 
 * For a TRUZY automated fallback, we would need a Proxy, which can be risky.
 * Instead, we'll try to detect the connection status once on startup.
 */
if (process.env.NODE_ENV !== 'production' && !globalForPrisma.usingFallback) {
    prismaInstance.$connect()
        .then(() => {
            console.log('✅ Prisma connected to Pooler');
        })
        .catch((err) => {
            if (err.code === 'P1001' || err.message?.includes('Can\'t reach database server')) {
                console.warn('⚠️  Pooler unreachable. Switching global Prisma instance to DIRECT_URL...');
                const directClient = new PrismaClient({
                    datasources: { db: { url: DIRECT_URL } },
                    log: ['error', 'warn'],
                });
                globalForPrisma.prisma = directClient;
                globalForPrisma.usingFallback = true;
                // Note: Existing imports of 'prisma' might still point to the old instance
                // but Next.js hot-reloading will usually pick up the new global on the next request/save.
            }
        });
}

export const prisma = prismaInstance;
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prismaInstance;
