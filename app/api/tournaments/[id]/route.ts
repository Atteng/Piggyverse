import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/tournaments/[id] - Get tournament details
export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);

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
        // --- SELF-HEALING: Sync Prize Pool Amount ---
        if (tournament.isIncentivized) {
            const confirmedRegs = tournament.registrations.filter((r: any) => r.paymentStatus === 'COMPLETED');
            const totalRevenue = confirmedRegs.reduce((acc: number, r: any) => acc + (r.expectedAmount || 0), 0);

            // If seed is null (legacy), we assume seed = currentPool - revenue (min 0)
            let currentSeed = (tournament as any).prizePoolSeed;
            if (currentSeed === null || currentSeed === undefined) {
                currentSeed = Math.max(0, (tournament.prizePoolAmount || 0) - totalRevenue);
                // Save it for future loads
                await prisma.tournament.update({
                    where: { id: params.id },
                    data: { prizePoolSeed: currentSeed }
                });
                (tournament as any).prizePoolSeed = currentSeed;
            }

            const livePool = currentSeed + totalRevenue;
            const epsilon = 0.000001;

            if (Math.abs((tournament.prizePoolAmount || 0) - livePool) > epsilon) {
                await prisma.tournament.update({
                    where: { id: params.id },
                    data: { prizePoolAmount: livePool }
                });
                // Update local object for response
                tournament.prizePoolAmount = livePool;
            }
        }
        // -----------------------------------------------------------------------

        return NextResponse.json(tournament);
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
            select: { hostId: true }
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
