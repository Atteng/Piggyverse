import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { recordTournamentWin } from '@/lib/stats';

// Simple in-memory cache for tournament details
const tournamentCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 5000; // 5 seconds

// GET /api/tournaments/[id] - Get tournament details
export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const tournamentId = params.id;
    const session = await getServerSession(authOptions);
    const cacheKey = `${tournamentId}:${session?.user?.id || 'guest'}`;

    // Check cache
    const cached = tournamentCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
        return NextResponse.json(cached.data);
    }

    try {

        // Check if user is host before querying to customize inviteCodes inclusion
        const baseTournament = await prisma.tournament.findUnique({
            where: { id: params.id },
            select: { hostId: true }
        });

        const isHost = baseTournament?.hostId === session?.user?.id;

        const tournament = await prisma.tournament.findUnique({
            where: { id: params.id },
            include: {
                game: {
                    select: {
                        id: true,
                        title: true,
                        thumbnailUrl: true,
                        categories: true
                    }
                },
                host: {
                    select: {
                        id: true,
                        username: true,
                        avatarUrl: true,
                        globalRank: true
                    }
                },
                bettingMarkets: {
                    include: {
                        outcomes: {
                            orderBy: { label: 'asc' }
                        }
                    }
                },
                ...(session?.user?.id ? {
                    inviteCodes: {
                        where: isHost ? {} : { usedByUserId: session.user.id },
                        select: {
                            code: true,
                            isUsed: true,
                            usedByUserId: true
                        }
                    }
                } : {}),
                registrations: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                avatarUrl: true,
                                globalRank: true
                            }
                        }
                    },
                    orderBy: { registeredAt: 'asc' }
                },
                _count: {
                    select: {
                        registrations: true
                    }
                }
            }
        });

        if (!tournament) {
            return NextResponse.json(
                { error: 'Tournament not found' },
                { status: 404 }
            );
        }

        // --- SELF-HEALING: Assign Invite Code if missing for registered user ---
        if (session?.user?.id && (!(tournament as any).inviteCodes || (tournament as any).inviteCodes.length === 0)) {
            const userReg = (tournament as any).registrations.find((r: any) => r.user.id === session.user.id);
            const isPaid = !tournament.entryFeeAmount || tournament.entryFeeAmount === 0 || userReg?.paymentStatus === 'COMPLETED';

            if (userReg && isPaid) {
                // Check if there are any available codes
                const availableCode = await (prisma as any).tournamentInviteCode.findFirst({
                    where: {
                        tournamentId: params.id,
                        isUsed: false
                    }
                });

                if (availableCode) {
                    await (prisma as any).tournamentInviteCode.update({
                        where: { id: availableCode.id },
                        data: {
                            isUsed: true,
                            usedByUserId: session.user.id
                        }
                    });

                    // Manually populate in response object to avoid second fetch
                    (tournament as any).inviteCodes = [{ code: availableCode.code }];
                }
            }
        }
        // -----------------------------------------------------------------------
        // --- PRIZE POOL CALCULATION: Use centralized logic ---
        const { calculateLivePrizePool } = await import('@/lib/tournaments');
        const livePrizePool = calculateLivePrizePool(tournament as any);

        // Override the returned object's prizePoolAmount with the live calculation
        // We do NOT write back to DB here to avoid race conditions on read
        (tournament as any).prizePoolAmount = livePrizePool;
        // -----------------------------------------------------------------------
        // --- ODDS CALCULATION: Inject currentOdds into outcomes ---
        const { calculateCurrentOdds } = await import('@/lib/betting');
        const marketsWithOdds = tournament.bettingMarkets.map(market => ({
            ...market,
            outcomes: market.outcomes.map(outcome => ({
                ...outcome,
                // Use persisted odd from worker if available, otherwise calculate live
                currentOdds: (outcome as any).currentOdds || calculateCurrentOdds(market, outcome)
            }))
        }));

        const tournamentWithOdds = {
            ...tournament,
            bettingMarkets: marketsWithOdds
        };
        // -----------------------------------------------------------------------

        // --- AUTO-ACTIVATE TOURNAMENT & WORKER ---
        const now = new Date();
        const startBoundary = tournamentWithOdds.registrationDeadline
            ? new Date(tournamentWithOdds.registrationDeadline)
            : new Date(tournamentWithOdds.startDate);

        if (tournamentWithOdds.status === 'PENDING' && now >= startBoundary) {
            // Update DB Status
            await prisma.tournament.update({
                where: { id: tournamentWithOdds.id },
                data: { status: 'ACTIVE' }
            });
            tournamentWithOdds.status = 'ACTIVE';

            // Check if there are autonomous markets to start the worker
            const hasAutonomous = tournamentWithOdds.bettingMarkets.some(m => m.isAutonomous);
            if (hasAutonomous) {
                const { autonomousOddsWorker } = await import('@/lib/betting/autonomous-odds-worker');
                autonomousOddsWorker.start();
                console.log(`[Auto-Activate] Started autonomous worker for tournament ${tournamentWithOdds.id}`);
            }
        }

        // Cache the result
        tournamentCache.set(cacheKey, { data: tournamentWithOdds, timestamp: Date.now() });

        return NextResponse.json(tournamentWithOdds);
    } catch (error) {
        console.error('Error fetching tournament:', error);
        return NextResponse.json(
            { error: 'Failed to fetch tournament' },
            { status: 500 }
        );
    }
}

// PATCH /api/tournaments/[id] - Update tournament (host only)
export async function PATCH(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const tournament = await prisma.tournament.findUnique({
            where: { id: params.id },
            select: { hostId: true, winnerId: true }
        });

        if (!tournament) {
            return NextResponse.json(
                { error: 'Tournament not found' },
                { status: 404 }
            );
        }

        if (tournament.hostId !== session.user.id) {
            return NextResponse.json(
                { error: 'Only tournament host can update' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { status, ...updateData } = body;

        // If prizePoolAmount is being updated, it acts as the new "seed" for hosts
        if (updateData.prizePoolAmount !== undefined) {
            (updateData as any).prizePoolSeed = updateData.prizePoolAmount;
        }

        const updated = await prisma.tournament.update({
            where: { id: params.id },
            data: {
                ...updateData,
                ...(status && { status }),
                registrationDeadline: updateData.registrationDeadline ? new Date(updateData.registrationDeadline) : (updateData.registrationDeadline === null ? null : undefined),
                discordLink: updateData.discordLink,
                lobbyUrl: updateData.lobbyUrl
            },
            include: {
                game: true,
                host: {
                    select: {
                        id: true,
                        username: true,
                        avatarUrl: true
                    }
                }
            }
        });

        // --- STATS SYNC: Update Effort and Proficiency ---
        const { incrementPrizePoolSeeded, recordTournamentWin, updateUserRank } = await import('@/lib/stats');

        // 1. If prize pool was updated, increment host's effort
        if (updateData.prizePoolAmount !== undefined && updateData.prizePoolAmount > 0) {
            await incrementPrizePoolSeeded(session.user.id, updateData.prizePoolAmount).catch(err =>
                console.error('Failed to update host effort stats:', err)
            );
        }

        // 2. If winner is declared, update winner's proficiency
        if (updateData.winnerId && updateData.winnerId !== tournament.winnerId) {
            await recordTournamentWin(updateData.winnerId).catch(err =>
                console.error('Failed to update winner stats:', err)
            );
        }

        // 3. Always refresh host rank if any changes were made
        await updateUserRank(session.user.id).catch(() => { });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error updating tournament:', error);
        return NextResponse.json(
            { error: 'Failed to update tournament' },
            { status: 500 }
        );
    }
}

// DELETE /api/tournaments/[id] - Cancel tournament (host only)
export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const tournament = await prisma.tournament.findUnique({
            where: { id: params.id },
            select: { hostId: true, status: true }
        });

        if (!tournament) {
            return NextResponse.json(
                { error: 'Tournament not found' },
                { status: 404 }
            );
        }

        if (tournament.hostId !== session.user.id) {
            return NextResponse.json(
                { error: 'Only tournament host can cancel' },
                { status: 403 }
            );
        }

        if (tournament.status === 'COMPLETED') {
            return NextResponse.json(
                { error: 'Cannot cancel completed tournament' },
                { status: 400 }
            );
        }

        await prisma.tournament.update({
            where: { id: params.id },
            data: { status: 'CANCELLED' }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error canceling tournament:', error);
        return NextResponse.json(
            { error: 'Failed to cancel tournament' },
            { status: 500 }
        );
    }
}
