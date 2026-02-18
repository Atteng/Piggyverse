import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { incrementPrizePoolSeeded } from '@/lib/stats';
import { createPublicClient, http, formatEther, parseAbi, formatUnits } from 'viem';
import { base } from 'viem/chains';

// Configuration helpers
const getSanitizedEnv = (key: string) => (process.env[key] || '').split('#')[0].replace(/['"]/g, '').trim();

const TREASURY_WALLET = getSanitizedEnv('NEXT_PUBLIC_CONTRACT_PIGGYVERSE').toLowerCase();

const TOKEN_CONTRACTS: Record<string, string> = {
    PIGGY: getSanitizedEnv('NEXT_PUBLIC_CONTRACT_PIGGY_TOKEN').toLowerCase(),
    USDC: getSanitizedEnv('NEXT_PUBLIC_CONTRACT_USDC').toLowerCase(),
    UP: getSanitizedEnv('NEXT_PUBLIC_CONTRACT_UP_TOKEN').toLowerCase(),
};

const TOKEN_DECIMALS: Record<string, number> = {
    PIGGY: 18,
    USDC: 6,
    UP: 18,
};

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
    const tournamentId = params.id;

    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { txHash, amount, token } = await request.json();

        if (!txHash || !txHash.startsWith('0x')) {
            return NextResponse.json({ error: 'Invalid transaction hash' }, { status: 400 });
        }

        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }

        if (!token || !TOKEN_CONTRACTS[token]) {
            return NextResponse.json({ error: 'Unsupported or missing token' }, { status: 400 });
        }

        // Verify tournament ownership
        const tournament = await prisma.tournament.findUnique({
            where: { id: tournamentId }
        });

        if (!tournament) {
            return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
        }

        if (tournament.hostId !== session.user.id) {
            return NextResponse.json({ error: 'Only the host can seed the prize pool' }, { status: 403 });
        }

        // Verify On-Chain
        const expectedTokenAddress = TOKEN_CONTRACTS[token];
        const decimals = TOKEN_DECIMALS[token] || 18;
        const expectedAmount = Number(amount);

        try {
            const receipt = await client.getTransactionReceipt({ hash: txHash as `0x${string}` });

            if (receipt.status !== 'success') {
                return NextResponse.json({ error: 'Transaction failed on blockchain' }, { status: 400 });
            }

            const TRANSFER_EVENT_SIGNATURE = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

            const transfers = receipt.logs.filter(log => {
                const isTransfer = log.topics[0] === TRANSFER_EVENT_SIGNATURE;
                if (!isTransfer) return false;

                const toAddress = log.topics[2] ? `0x${log.topics[2].slice(26)}`.toLowerCase() : "";
                return toAddress === TREASURY_WALLET;
            });

            let actualAmountFinal = 0;

            if (transfers.length === 0) {
                // Check native ETH if applicable
                if (!expectedTokenAddress) {
                    const tx = await client.getTransaction({ hash: txHash as `0x${string}` });
                    if (tx.to?.toLowerCase() !== TREASURY_WALLET) {
                        return NextResponse.json({ error: 'Recipient mismatch' }, { status: 400 });
                    }
                    actualAmountFinal = parseFloat(formatEther(tx.value));
                } else {
                    return NextResponse.json({ error: 'No transfer to Treasury found' }, { status: 400 });
                }
            } else {
                const matchingTokenTransfer = transfers.find(log => log.address.toLowerCase() === expectedTokenAddress);
                if (!matchingTokenTransfer) {
                    return NextResponse.json({ error: 'Token contract mismatch' }, { status: 400 });
                }

                const amountBigInt = BigInt(matchingTokenTransfer.data);
                actualAmountFinal = parseFloat(formatUnits(amountBigInt, decimals));
            }

            // Check Amount with epsilon
            const epsilon = 0.000001;
            if (Math.abs(actualAmountFinal - expectedAmount) > epsilon) {
                return NextResponse.json({
                    error: `Amount mismatch. Expected: ${expectedAmount}, Got: ${actualAmountFinal}`
                }, { status: 400 });
            }

            // Update stats & rank via centralized utility
            // Use live Price Oracle to convert token amount to USD value for scoring
            const { getUSDValue } = await import('@/lib/price-oracle');
            const usdValue = await getUSDValue(token, actualAmountFinal);
            await incrementPrizePoolSeeded(session.user.id, usdValue);

            // Fetch final state for response
            const finalTournament = await prisma.tournament.findUnique({
                where: { id: tournamentId }
            });

            // Create a record in TransactionReceipt for tracking
            await prisma.transactionReceipt.create({
                data: {
                    txHash: txHash,
                    fromAddress: receipt.from.toLowerCase(),
                    amount: actualAmountFinal,
                    token: token,
                    type: 'SEED',
                    referenceId: tournamentId,
                    status: 'VERIFIED',
                    verifiedAt: new Date()
                }
            });

            return NextResponse.json({
                success: true,
                amount: actualAmountFinal,
                newPrizePool: finalTournament?.prizePoolAmount,
                newSeedAmount: finalTournament?.prizePoolSeed
            });

        } catch (chainError) {
            console.error('Chain validation failed:', chainError);
            return NextResponse.json({ error: 'Transaction validation failed' }, { status: 400 });
        }

    } catch (error) {
        console.error('Error seeding tournament:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
