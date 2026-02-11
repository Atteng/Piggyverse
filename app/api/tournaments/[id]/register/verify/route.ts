import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createPublicClient, http, formatEther } from 'viem';
import { base } from 'viem/chains';

// Treasury address must match the one in intent
if (!process.env.NEXT_PUBLIC_CONTRACT_PIGGYVERSE) {
    throw new Error("NEXT_PUBLIC_CONTRACT_PIGGYVERSE is not defined in environment variables");
}
const TREASURY_WALLET = process.env.NEXT_PUBLIC_CONTRACT_PIGGYVERSE.toLowerCase();

// Initialize Viem Client (Base Network)
const client = createPublicClient({
    chain: base,
    transport: http()
});

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

        const { txHash } = await request.json();

        if (!txHash || !txHash.startsWith('0x')) {
            return NextResponse.json({ error: 'Invalid transaction hash' }, { status: 400 });
        }

        // Find pending registration
        const registration = await prisma.tournamentRegistration.findUnique({
            where: {
                tournamentId_userId: {
                    tournamentId: params.id,
                    userId: session.user.id
                }
            },
            include: {
                tournament: true
            }
        });

        if (!registration) {
            return NextResponse.json({ error: 'No registration found' }, { status: 404 });
        }

        if (registration.paymentStatus === 'COMPLETED') {
            return NextResponse.json({ success: true, message: 'Already verified' });
        }

        if (!registration.expectedAmount) {
            return NextResponse.json({ error: 'No payment expected for this registration' }, { status: 400 });
        }

        // Verify On-Chain
        try {
            const tx = await client.getTransaction({ hash: txHash as `0x${string}` });

            // Check Recipient
            if (tx.to?.toLowerCase() !== TREASURY_WALLET) {
                return NextResponse.json({ error: 'Transaction not sent to Treasury' }, { status: 400 });
            }

            // Check Amount
            // We need to handle decimals. Assuming PIGGY has 18 decimals?
            // Or validation uses strict string/float comparison?
            // tx.value is BigInt (wei).
            // expectedAmount is Float (e.g. 50.0012).
            const txValueEth = formatEther(tx.value);
            const txValueFloat = parseFloat(txValueEth);

            // Allow small epsilon for float precision?
            // expectedAmount: 50.0012
            // txValue: 50.001200000000....
            const epsilon = 0.000001;
            if (Math.abs(txValueFloat - registration.expectedAmount) > epsilon) {
                return NextResponse.json({
                    error: `Amount mismatch. Expected: ${registration.expectedAmount}, Got: ${txValueFloat}`
                }, { status: 400 });
            }

            // Mark as Paid
            await prisma.tournamentRegistration.update({
                where: { id: registration.id },
                data: {
                    paymentStatus: 'COMPLETED',
                    txHash: txHash,
                    registeredAt: new Date() // Update time to confirmation?
                }
            });

            // Increment Tournament Count
            await prisma.tournament.update({
                where: { id: params.id },
                data: {
                    registeredPlayers: { increment: 1 }
                }
            });

            return NextResponse.json({ success: true });

        } catch (chainError) {
            console.error('Chain validation failed:', chainError);
            return NextResponse.json({ error: 'Transaction not found or invalid on BASE network' }, { status: 400 });
        }

    } catch (error) {
        console.error('Error validating payment:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
