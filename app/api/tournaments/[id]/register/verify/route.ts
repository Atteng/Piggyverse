import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createPublicClient, http, formatEther, decodeFunctionData, parseAbi, formatUnits } from 'viem';
import { base } from 'viem/chains';
import { BLOCKCHAIN_CONFIG } from '@/lib/blockchain-config';

// Treasury address must match the one in intent
if (!process.env.NEXT_PUBLIC_CONTRACT_PIGGYVERSE) {
    throw new Error("NEXT_PUBLIC_CONTRACT_PIGGYVERSE is not defined in environment variables");
}
const TREASURY_WALLET = process.env.NEXT_PUBLIC_CONTRACT_PIGGYVERSE.toLowerCase();

// Token Contract Addresses
const TOKEN_CONTRACTS: Record<string, string> = {
    PIGGY: BLOCKCHAIN_CONFIG.CONTRACTS.PIGGY_TOKEN.toLowerCase(),
    USDC: BLOCKCHAIN_CONFIG.CONTRACTS.USDC_TOKEN.toLowerCase(),
    UP: BLOCKCHAIN_CONFIG.CONTRACTS.UP_TOKEN.toLowerCase(),
};

// Token Decimals
const TOKEN_DECIMALS: Record<string, number> = {
    PIGGY: 18,
    USDC: 6,
    UP: 18,
};

// ERC20 Transfer ABI for decoding
const ERC20_ABI = parseAbi([
    'function transfer(address to, uint256 amount) returns (bool)',
]);

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

        const token = registration.tournament.entryFeeToken || 'PIGGY';
        const expectedTokenAddress = TOKEN_CONTRACTS[token];
        const decimals = TOKEN_DECIMALS[token] || 18;

        // Verify On-Chain
        try {
            const tx = await client.getTransaction({ hash: txHash as `0x${string}` });

            let actualRecipient = "";
            let actualAmount = 0;

            // 1. Check if it's an ERC20 Transfer
            if (expectedTokenAddress) {
                // If token is an ERC20, the tx 'to' must be the contract address
                if (tx.to?.toLowerCase() !== expectedTokenAddress) {
                    return NextResponse.json({
                        error: `Transaction sent to wrong contract. Expected ${token} contract (${expectedTokenAddress}), but got ${tx.to}`
                    }, { status: 400 });
                }

                // Decode transfer data
                try {
                    const { args, functionName } = decodeFunctionData({
                        abi: ERC20_ABI,
                        data: tx.input,
                    });

                    if (functionName !== 'transfer') {
                        return NextResponse.json({ error: 'Not a transfer transaction' }, { status: 400 });
                    }

                    const [to, amount] = args as [string, bigint];
                    actualRecipient = to.toLowerCase();
                    actualAmount = parseFloat(formatUnits(amount, decimals));
                } catch (decodeError) {
                    console.error('Failed to decode tx data:', decodeError);
                    return NextResponse.json({ error: 'Could not parse ERC20 transfer data. Ensure this is a direct transfer.' }, { status: 400 });
                }
            } else {
                // 2. Native Transfer (ETH/MATIC)
                actualRecipient = tx.to?.toLowerCase() || "";
                actualAmount = parseFloat(formatEther(tx.value));
            }

            // Check Recipient
            if (actualRecipient !== TREASURY_WALLET) {
                return NextResponse.json({
                    error: `Recipient mismatch. Expected Treasury (${TREASURY_WALLET}), but transaction sent to ${actualRecipient}`
                }, { status: 400 });
            }

            // Check Amount with epsilon
            const epsilon = 0.000001;
            if (Math.abs(actualAmount - registration.expectedAmount) > epsilon) {
                return NextResponse.json({
                    error: `Amount mismatch. Expected: ${registration.expectedAmount} ${token}, Got: ${actualAmount} ${token}`
                }, { status: 400 });
            }

            // Check if tournament has invite codes and assign one
            const availableCode = await prisma.tournamentInviteCode.findFirst({
                where: {
                    tournamentId: params.id,
                    isUsed: false
                }
            });

            const hasInviteCodes = await prisma.tournamentInviteCode.count({
                where: { tournamentId: params.id }
            }) > 0;

            // Mark as Paid and Assign Code
            await prisma.tournamentRegistration.update({
                where: { id: registration.id },
                data: {
                    paymentStatus: 'COMPLETED',
                    txHash: txHash,
                    registeredAt: new Date()
                }
            });

            // Assign code if available
            if (availableCode) {
                await prisma.tournamentInviteCode.update({
                    where: { id: availableCode.id },
                    data: {
                        isUsed: true,
                        usedByUserId: session.user.id
                    }
                });
            }

            // Increment Tournament Count and Prize Pool
            await prisma.tournament.update({
                where: { id: params.id },
                data: {
                    registeredPlayers: { increment: 1 },
                    prizePoolAmount: { increment: actualAmount },
                    // Set prize pool token if it's currently null
                    prizePoolToken: registration.tournament.prizePoolToken || token
                }
            });

            return NextResponse.json({ success: true, token, amount: actualAmount });

        } catch (chainError) {
            console.error('Chain validation failed:', chainError);
            return NextResponse.json({ error: 'Transaction not found or invalid on blockchain' }, { status: 400 });
        }

    } catch (error) {
        console.error('Error validating payment:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
