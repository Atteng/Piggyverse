import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
    usingFallback: boolean;
};

// Get database URLs
const POOLER_URL = process.env.DATABASE_URL!;
const DIRECT_URL = process.env.DIRECT_DATABASE_URL || POOLER_URL.replace('pooler.supabase.com', 'connect.supabase.com');

// Function to create Prisma client with a specific URL
function createPrismaClient(url: string) {
    return new PrismaClient({
        datasources: {
            db: { url }
        },
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
}

// Function to test connection
async function testConnection(client: PrismaClient): Promise<boolean> {
    try {
        await client.$queryRaw`SELECT 1`;
        return true;
    } catch (error) {
        return false;
    }
}

// Initialize Prisma client with fallback logic
async function initializePrisma() {
    if (globalForPrisma.prisma) {
        return globalForPrisma.prisma;
    }

    // Try pooler first
    let client = createPrismaClient(POOLER_URL);
    const poolerWorks = await testConnection(client);

    if (!poolerWorks) {
        console.warn('⚠️  Pooler connection failed, switching to direct connection...');
        await client.$disconnect();
        client = createPrismaClient(DIRECT_URL);

        const directWorks = await testConnection(client);
        if (directWorks) {
            console.log('✅ Connected using direct connection');
            globalForPrisma.usingFallback = true;
        } else {
            console.error('❌ Both pooler and direct connections failed');
        }
    } else {
        console.log('✅ Connected using pooler');
        globalForPrisma.usingFallback = false;
    }

    globalForPrisma.prisma = client;
    return client;
}

// Export a promise that resolves to the Prisma client
export const prisma = globalForPrisma.prisma ?? createPrismaClient(POOLER_URL);

// Initialize connection on first import (in development)
if (process.env.NODE_ENV !== 'production' && !globalForPrisma.prisma) {
    initializePrisma().then(client => {
        globalForPrisma.prisma = client;
    }).catch(err => {
        console.error('Failed to initialize Prisma:', err);
    });
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
