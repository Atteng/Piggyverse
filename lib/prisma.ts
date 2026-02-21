import { PrismaClient } from '@prisma/client';

// Collect all available database URLs from the environment
const urls = [
    process.env.DATABASE_URL,
    process.env.TXN_DATABASE_URL,
    process.env.DIRECT_DATABASE_URL,
].filter(Boolean) as string[];

// Remove duplicates in case they point to the exact same string
const uniqueUrls = Array.from(new Set(urls));

if (uniqueUrls.length === 0) {
    throw new Error("No database URLs found in environment variables.");
}

const globalForPrisma = globalThis as unknown as {
    prismaClients: PrismaClient[] | undefined;
    currentClientIndex: number;
};

// Ensure pooler connections (port 6543) have pgbouncer=true and disable statement caching
const sanitizedUrls = uniqueUrls.map(url => {
    if (url.includes(':6543')) {
        let sanitized = url;
        if (!sanitized.includes('pgbouncer=true')) {
            const separator = sanitized.includes('?') ? '&' : '?';
            sanitized = `${sanitized}${separator}pgbouncer=true`;
        }
        if (!sanitized.includes('statement_cache_size=')) {
            const separator = sanitized.includes('?') ? '&' : '?';
            sanitized = `${sanitized}${separator}statement_cache_size=0`;
        }
        if (!sanitized.includes('connection_limit=')) {
            const separator = sanitized.includes('?') ? '&' : '?';
            sanitized = `${sanitized}${separator}connection_limit=3`;
        }
        return sanitized;
    }
    return url;
});

// Instantiate a client for each unique URL
const clients = globalForPrisma.prismaClients ?? sanitizedUrls.map(url => new PrismaClient({
    datasources: { db: { url } },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
}));

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prismaClients = clients;
    globalForPrisma.currentClientIndex = globalForPrisma.currentClientIndex ?? 0;
}

// Stateful pointer for the active client index
let currentClientIndex = globalForPrisma.currentClientIndex ?? 0;

/**
 * Intelligent Prisma Proxy (Multi-Fallback)
 * Attempts to use the primary client. If a connection error occurs (P1001/P1011),
 * it shifts to the next available client in the array and re-executes.
 */
function createMultiFallbackProxy(clients: PrismaClient[]): PrismaClient {
    return new Proxy(clients[0], { // Target is just for typings/base reflections
        get(target, prop) {
            const getActiveClient = () => clients[currentClientIndex];
            const activeClient = Reflect.get(getActiveClient(), prop);

            // Only intercept model methods/functions (e.g., prisma.user.findMany)
            if (typeof activeClient === 'function') {
                return async (...args: any[]) => {
                    // Start attempting from the currently known good client
                    let attemptIndex = currentClientIndex;

                    while (attemptIndex < clients.length) {
                        try {
                            const clientMethod = Reflect.get(clients[attemptIndex], prop);
                            return await clientMethod.apply(clients[attemptIndex], args);
                        } catch (error: any) {
                            // Check if it's a connection/timeout error (including Prisma Accelerate P5010/P5000)
                            const isConnectionError = error.code === 'P1001' ||
                                error.code === 'P1011' ||
                                error.code === 'P5010' ||
                                error.code === 'P5000' ||
                                error.message?.includes("Can't reach database server") ||
                                error.message?.includes("fetch failed") ||
                                error.message?.includes("Cannot fetch data from service") ||
                                error.message?.includes("MaxClientsInSessionMode") ||
                                error.message?.includes("max clients reached") ||
                                // Handle Prepared Statement Errors (PGBouncer conflicts)
                                error.message?.includes("prepared statement") ||
                                error.message?.includes("42P05") ||
                                error.message?.includes("26000");

                            if (isConnectionError) {
                                console.warn(`[Prisma Fallback] Connection failed on client #${attemptIndex} (${error.code || 'Network/Pool Error'}).`);

                                attemptIndex++; // Try the next client

                                if (attemptIndex < clients.length) {
                                    console.warn(`[Prisma Fallback] Failing over to substitute client #${attemptIndex}...`);
                                    currentClientIndex = attemptIndex; // Globally switch the active client
                                    if (process.env.NODE_ENV !== 'production') {
                                        globalForPrisma.currentClientIndex = currentClientIndex;
                                    }
                                    continue; // Re-run the while loop
                                } else {
                                    console.error(`[Prisma Fallback] 🚨 ALL database connections exhausted!`);
                                    throw error; // All failed, propagate up
                                }
                            }

                            // It's a normal application error (e.g. Unique Constraint), throw it
                            throw error;
                        }
                    }
                };
            }

            // For nested properties (e.g., prisma.user), recurse the proxy
            if (typeof activeClient === 'object' && activeClient !== null) {
                return new Proxy(activeClient, {
                    get(delegateTarget, delegateProp) {
                        const getActiveDelegate = () => Reflect.get(clients[currentClientIndex], prop);
                        let activeDelegate = Reflect.get(getActiveDelegate(), delegateProp);

                        if (typeof activeDelegate === 'function') {
                            return async (...args: any[]) => {
                                let attemptIndex = currentClientIndex;

                                while (attemptIndex < clients.length) {
                                    try {
                                        const currentDelegate = Reflect.get(clients[attemptIndex], prop);
                                        const delegateMethod = Reflect.get(currentDelegate, delegateProp);
                                        return await delegateMethod.apply(currentDelegate, args);
                                    } catch (error: any) {
                                        const isConnectionError = error.code === 'P1001' ||
                                            error.code === 'P1011' ||
                                            error.code === 'P5010' ||
                                            error.code === 'P5000' ||
                                            error.message?.includes("Can't reach database server") ||
                                            error.message?.includes("fetch failed") ||
                                            error.message?.includes("Cannot fetch data from service") ||
                                            error.message?.includes("MaxClientsInSessionMode") ||
                                            error.message?.includes("max clients reached") ||
                                            // Handle Prepared Statement Errors (PGBouncer conflicts)
                                            error.message?.includes("prepared statement") ||
                                            error.message?.includes("42P05") ||
                                            error.message?.includes("26000");

                                        if (isConnectionError) {
                                            console.warn(`[Prisma Fallback] Nested Connection failed on client #${attemptIndex} (${error.code || 'Network/Pool Error'}).`);

                                            attemptIndex++;

                                            if (attemptIndex < clients.length) {
                                                console.warn(`[Prisma Fallback] Nested Failing over to client #${attemptIndex}...`);
                                                currentClientIndex = attemptIndex;
                                                if (process.env.NODE_ENV !== 'production') {
                                                    globalForPrisma.currentClientIndex = currentClientIndex;
                                                }
                                                continue;
                                            } else {
                                                console.error(`[Prisma Fallback] 🚨 ALL nested database connections exhausted!`);
                                                throw error;
                                            }
                                        }
                                        throw error;
                                    }
                                }
                            }
                        }
                        return activeDelegate;
                    }
                });
            }

            return activeClient;
        }
    });
}

export const prisma = createMultiFallbackProxy(clients);
