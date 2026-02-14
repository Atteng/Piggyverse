import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Hardcoded Treasury Wallet (User's Wallet / Admin)
// In production, this should be in ENV
const getSanitizedEnv = (key: string) => (process.env[key] || '').split('#')[0].replace(/['"]/g, '').trim();

if (!process.env.NEXT_PUBLIC_CONTRACT_PIGGYVERSE) {
    throw new Error("NEXT_PUBLIC_CONTRACT_PIGGYVERSE is not defined in environment variables");
}
const TREASURY_WALLET = getSanitizedEnv('NEXT_PUBLIC_CONTRACT_PIGGYVERSE');

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

        const tournament = await prisma.tournament.findUnique({
            where: { id: params.id }
        });

        if (!tournament) {
            return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
        }

        // Validate registration deadline
        const deadline = tournament.registrationDeadline || tournament.startDate;
        if (new Date() > new Date(deadline)) {
            return NextResponse.json(
                { error: 'Registration deadline has passed' },
                { status: 403 }
            );
        }

        if (!tournament.entryFeeAmount || tournament.entryFeeAmount <= 0) {
            return NextResponse.json({ error: 'This tournament is free' }, { status: 400 });
        }

        // Check for existing registration
        let registration = await prisma.tournamentRegistration.findUnique({
            where: {
                tournamentId_userId: {
                    tournamentId: params.id,
                    userId: session.user.id
                }
            }
        });

        // If already paid, return success
        if (registration && registration.paymentStatus === 'COMPLETED') {
            return NextResponse.json({
                status: 'COMPLETED',
                message: 'Already registered'
            });
        }

        // If pending, reuse the expected amount if valid (otherwise generate new)
        // For simplicity, we'll reuse or generate if null.
        let uniqueAmount = registration?.expectedAmount;

        if (!uniqueAmount) {
            // Generate unique amount
            // Try 10 times to find a unique slot
            for (let i = 0; i < 10; i++) {
                // Generate random offset between 0.0001 and 0.0999
                const offset = Number((Math.random() * 0.1).toFixed(4));
                // Avoid 0.0000 if strict
                const candidate = tournament.entryFeeAmount + (offset === 0 ? 0.0001 : offset);

                // Check collision
                const collision = await prisma.tournamentRegistration.findFirst({
                    where: {
                        tournamentId: params.id,
                        expectedAmount: candidate,
                        paymentStatus: 'PENDING',
                        // Exclude self
                        userId: { not: session.user.id }
                    }
                });

                if (!collision) {
                    uniqueAmount = candidate;
                    break;
                }
            }

            if (!uniqueAmount) {
                return NextResponse.json({ error: 'System busy, please try again later' }, { status: 503 });
            }
        }

        // Upsert registration
        registration = await prisma.tournamentRegistration.upsert({
            where: {
                tournamentId_userId: {
                    tournamentId: params.id,
                    userId: session.user.id
                }
            },
            update: {
                expectedAmount: uniqueAmount,
                paymentStatus: 'PENDING',
                paymentExpiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 mins
            },
            create: {
                tournamentId: params.id,
                userId: session.user.id,
                expectedAmount: uniqueAmount,
                paymentStatus: 'PENDING',
                paymentExpiresAt: new Date(Date.now() + 30 * 60 * 1000)
            }
        });

        return NextResponse.json({
            status: 'PENDING',
            amount: uniqueAmount,
            token: tournament.entryFeeToken || 'PIGGY',
            address: TREASURY_WALLET,
            expiresAt: registration.paymentExpiresAt
        });

    } catch (error) {
        console.error('Error in payment intent:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
