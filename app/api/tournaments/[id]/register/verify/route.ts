import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createPublicClient, http, formatEther, decodeFunctionData, parseAbi, formatUnits } from 'viem';
import { base } from 'viem/chains';
import { BLOCKCHAIN_CONFIG } from '@/lib/blockchain-config';

// Treasury address must match the one in intent
const getSanitizedEnv = (key: string) => (process.env[key] || '').split('#')[0].replace(/['"]/g, '').trim();

if (!process.env.NEXT_PUBLIC_CONTRACT_PIGGYVERSE) {
    throw new Error("NEXT_PUBLIC_CONTRACT_PIGGYVERSE is not defined in environment variables");
}
const TREASURY_WALLET = getSanitizedEnv('NEXT_PUBLIC_CONTRACT_PIGGYVERSE').toLowerCase();

// Token Contract Addresses
const TOKEN_CONTRACTS: Record<string, string> = {
    PIGGY: getSanitizedEnv('NEXT_PUBLIC_CONTRACT_PIGGY_TOKEN').toLowerCase(),
    USDC: getSanitizedEnv('NEXT_PUBLIC_CONTRACT_USDC').toLowerCase(),
    UP: getSanitizedEnv('NEXT_PUBLIC_CONTRACT_UP_TOKEN').toLowerCase(),
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
            // Use getTransactionReceipt to see the logs (critical for Smart Wallets/Multicall)
            const receipt = await client.getTransactionReceipt({ hash: txHash as `0x${string}` });

            if (receipt.status !== 'success') {
                return NextResponse.json({ error: 'Transaction failed on blockchain' }, { status: 400 });
            }

            // Define the Transfer event signature for parsing
            const TRANSFER_EVENT_SIGNATURE = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

            // Filter logs for Transfer events to our Treasury
            const transfers = receipt.logs.filter(log => {
                const isTransfer = log.topics[0] === TRANSFER_EVENT_SIGNATURE;
                if (!isTransfer) return false;

                // ERC20 Transfer log: topics[1] = from, topics[2] = to
                // We check if the 'to' address matches our treasury
                const toAddress = log.topics[2] ? `0x${log.topics[2].slice(26)}`.toLowerCase() : "";
                return toAddress === TREASURY_WALLET;
            });

            if (transfers.length === 0) {
                // If native ETH was expected, check receipt.to (this section applies if expectedTokenAddress is null)
                if (!expectedTokenAddress) {
                    const tx = await client.getTransaction({ hash: txHash as `0x${string}` });
                    const actualRecipient = tx.to?.toLowerCase() || "";
                    const actualAmount = parseFloat(formatEther(tx.value));

                    if (actualRecipient !== TREASURY_WALLET) {
                        return NextResponse.json({
                            error: `Recipient mismatch. Expected Treasury (${TREASURY_WALLET}), but transaction sent to ${actualRecipient}`
                        }, { status: 400 });
                    }

                    const epsilon = 0.000001;
                    if (Math.abs(actualAmount - registration.expectedAmount) > epsilon) {
                        return NextResponse.json({
                            error: `Amount mismatch. Expected: ${registration.expectedAmount} ETH, Got: ${actualAmount} ETH`
                        }, { status: 400 });
                    }

                    // Native SUCCESS logic continues below (shared with ERC20)
                    var actualAmountFinal = actualAmount;
                } else {
                    return NextResponse.json({
                        error: `No transfer to Treasury found in this transaction. Expected ${token} transfer to ${TREASURY_WALLET}.`
                    }, { status: 400 });
                }
            } else {
                // ERC20 Transfer Found
                // Find the transfer that matches the expected token contract
                const matchingTokenTransfer = transfers.find(log => log.address.toLowerCase() === expectedTokenAddress);

                if (!matchingTokenTransfer) {
                    const foundTokens = [...new Set(transfers.map(l => l.address.toLowerCase()))];
                    return NextResponse.json({
                        error: `Transaction sent to wrong contract. Expected ${token} contract (${expectedTokenAddress}), but logs show transfers for: ${foundTokens.join(', ')}`
                    }, { status: 400 });
                }

                // Parse the amount from log.data (for standard Transfer event)
                const amountHex = matchingTokenTransfer.data;
                const amountBigInt = BigInt(amountHex);
                var actualAmountFinal = parseFloat(formatUnits(amountBigInt, decimals));

                // Check Amount with epsilon
                const epsilon = 0.000001;
                if (Math.abs(actualAmountFinal - registration.expectedAmount) > epsilon) {
                    return NextResponse.json({
                        error: `Amount mismatch. Expected: ${registration.expectedAmount} ${token}, Got: ${actualAmountFinal} ${token}`
                    }, { status: 400 });
                }
            }

            const actualAmount = actualAmountFinal;

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
                    prizePoolAmount: (registration.tournament.prizePoolAmount || 0) + actualAmount,
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
