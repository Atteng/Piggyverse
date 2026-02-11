import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/tournaments/[id]/register - Register for tournament
export async function POST(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch tournament
        const tournament = await prisma.tournament.findUnique({
            where: { id: params.id },
            include: {
                _count: {
                    select: { registrations: true }
                }
            }
        });

        if (!tournament) {
            return NextResponse.json(
                { error: 'Tournament not found' },
                { status: 404 }
            );
        }

        // Validate tournament status
        if (tournament.status !== 'PENDING') {
            return NextResponse.json(
                { error: 'Tournament registration is closed' },
                { status: 400 }
            );
        }

        // Check if tournament is full
        if (tournament._count.registrations >= tournament.maxPlayers) {
            return NextResponse.json(
                { error: 'Tournament is full' },
                { status: 400 }
            );
        }

        // Check if user is already registered
        const existingRegistration = await prisma.tournamentRegistration.findUnique({
            where: {
                tournamentId_userId: {
                    tournamentId: params.id,
                    userId: session.user.id
                }
            }
        });

        if (existingRegistration) {
            return NextResponse.json(
                { error: 'Already registered for this tournament' },
                { status: 400 }
            );
        }

        // Create registration
        const registration = await prisma.tournamentRegistration.create({
            data: {
                tournamentId: params.id,
                userId: session.user.id
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        avatarUrl: true
                    }
                },
                tournament: {
                    select: {
                        name: true
                    }
                }
            }
        });

        // Update tournament registered count
        await prisma.tournament.update({
            where: { id: params.id },
            data: {
                registeredPlayers: { increment: 1 }
            }
        });

        // Create notification
        await prisma.notification.create({
            data: {
                userId: session.user.id,
                type: 'TOURNAMENT',
                title: 'Registration Confirmed',
                message: `You're registered for ${registration.tournament.name}`,
                actionUrl: `/competitive-hub/${params.id}`,
                actionLabel: 'View Tournament'
            }
        });

        return NextResponse.json(registration, { status: 201 });
    } catch (error) {
        console.error('Error registering for tournament:', error);
        return NextResponse.json(
            { error: 'Failed to register for tournament' },
            { status: 500 }
        );
    }
}

// DELETE /api/tournaments/[id]/register - Unregister from tournament
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

        const registration = await prisma.tournamentRegistration.findUnique({
            where: {
                tournamentId_userId: {
                    tournamentId: params.id,
                    userId: session.user.id
                }
            }
        });

        if (!registration) {
            return NextResponse.json(
                { error: 'Not registered for this tournament' },
                { status: 404 }
            );
        }

        // Delete registration
        await prisma.tournamentRegistration.delete({
            where: {
                tournamentId_userId: {
                    tournamentId: params.id,
                    userId: session.user.id
                }
            }
        });

        // Update tournament registered count
        await prisma.tournament.update({
            where: { id: params.id },
            data: {
                registeredPlayers: { decrement: 1 }
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error unregistering from tournament:', error);
        return NextResponse.json(
            { error: 'Failed to unregister' },
            { status: 500 }
        );
    }
}
