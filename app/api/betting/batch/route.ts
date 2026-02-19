import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateBookingCode } from '@/lib/betting/booking-codes';
import { updateMarketWeights } from '@/lib/betting/odds-engine';
import { createPublicClient, http, formatUnits, PublicClient } from 'viem';
import { base, mainnet, baseSepolia } from 'viem/chains';
import { BLOCKCHAIN_CONFIG } from '@/lib/blockchain-config';

// Initialize Default Client (Base)
const client = createPublicClient({
    chain: base,
    transport: http(BLOCKCHAIN_CONFIG.RPC_URLS.BASE)
});

// Treasury Address
const TREASURY_WALLET = BLOCKCHAIN_CONFIG.CONTRACTS.TREASURY_WALLET?.toLowerCase();

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: (session.user as any).id }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const body = await request.json();
        const { txHash, bets, totalAmount } = body;

        if (!txHash || !bets || !Array.isArray(bets) || bets.length === 0) {
            return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
        }

        if (!TREASURY_WALLET) {
            return NextResponse.json({ error: 'Server configuration error: Treasury not defined' }, { status: 500 });
        }

        // --- ON-CHAIN VERIFICATION START ---

        // 1. Determine Token & Chain
        // Assumption: All bets in a batch must use the same token (or we check the first one)
        // In V2, the frontend sends the token used for payment. We fallback to USDC if not specified.
        const token = (body.token || "USDC").toUpperCase();
        const targetNetwork = BLOCKCHAIN_CONFIG.TOKEN_NETWORKS[token] || 'base';

        // Get expected contract address from config
        let expectedTokenAddress: string | undefined;
        if (token === 'USDC') expectedTokenAddress = BLOCKCHAIN_CONFIG.CONTRACTS.USDC_TOKEN;
        else if (token === 'PIGGY') expectedTokenAddress = BLOCKCHAIN_CONFIG.CONTRACTS.PIGGY_TOKEN;
        else if (token === 'UP') expectedTokenAddress = BLOCKCHAIN_CONFIG.CONTRACTS.UP_TOKEN;
        else if (token === 'TUSDC') expectedTokenAddress = BLOCKCHAIN_CONFIG.CONTRACTS.TUSDC_TOKEN;

        expectedTokenAddress = expectedTokenAddress?.toLowerCase();

        // Dynamic Client Selection
        let chainClient: any = client;
        if (targetNetwork === 'mainnet') {
            chainClient = createPublicClient({
                chain: mainnet,
                transport: http(BLOCKCHAIN_CONFIG.RPC_URLS.ETH)
            });
        } else if (targetNetwork === 'base-sepolia') {
            chainClient = createPublicClient({
                chain: baseSepolia,
                transport: http(BLOCKCHAIN_CONFIG.RPC_URLS.BASE_SEPOLIA)
            });
        }

        try {
            // 2. Fetch Receipt
            const receipt = await chainClient.getTransactionReceipt({ hash: txHash as `0x${string}` });

            if (receipt.status !== 'success') {
                return NextResponse.json({ error: 'Transaction failed on blockchain' }, { status: 400 });
            }

            // 3. Verify Transfer to Treasury
            const TRANSFER_EVENT_SIGNATURE = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

            const transfers = receipt.logs.filter((log: any) => {
                const isTransfer = log.topics[0] === TRANSFER_EVENT_SIGNATURE;
                if (!isTransfer) return false;
                const toAddress = log.topics[2] ? `0x${log.topics[2].slice(26)}`.toLowerCase() : "";
                return toAddress === TREASURY_WALLET;
            });

            if (transfers.length === 0) {
                return NextResponse.json({ error: 'No transfer to Treasury found in transaction' }, { status: 400 });
            }

            // 4. Verify Total Amount
            // Sum all transfers to treasury in this tx (in case of multiple transfers)
            let totalTransferred = 0;
            const decimals = 6; // USDC decimals

            for (const log of transfers) {
                // Check if it matches expected token contract (if we want to be strict)
                if (expectedTokenAddress && log.address.toLowerCase() !== expectedTokenAddress) continue;

                const amountBigInt = BigInt(log.data);
                totalTransferred += parseFloat(formatUnits(amountBigInt, decimals));
            }

            // Check tolerance
            const epsilon = 0.001;
            const expectedTotal = parseFloat(totalAmount);

            if (Math.abs(totalTransferred - expectedTotal) > epsilon) {
                return NextResponse.json({
                    error: `Amount mismatch. Received: ${totalTransferred}, Expected: ${expectedTotal}`
                }, { status: 400 });
            }

            // Check if hash is already used
            const existingBet = await prisma.bet.findFirst({ where: { txHash } });
            if (existingBet) {
                return NextResponse.json({ error: 'Transaction hash already used' }, { status: 400 });
            }

        } catch (chainError) {
            console.error("Batch Verification Failed:", chainError);
            return NextResponse.json({ error: 'Transaction not found. Please wait a few seconds.' }, { status: 400 });
        }
        // --- ON-CHAIN VERIFICATION END ---

        // Process all bets in a single transaction (30s timeout for slow pooler)
        const createdBets = await prisma.$transaction(async (tx) => {
            const results = [];
            const batchBookingCode = generateBookingCode(); // Shared code for the entire slip

            for (const betSelection of bets) {
                const { marketId, outcomeId, amount, odds } = betSelection;

                // 1. Fetch market and validate
                const market = await tx.bettingMarket.findUnique({
                    where: { id: marketId },
                    include: { outcomes: true }
                });

                if (!market || market.status !== 'OPEN') {
                    throw new Error(`Market for ${betSelection.marketQuestion} is no longer open`);
                }

                // 2. Create the bet
                const bet = await tx.bet.create({
                    data: {
                        marketId,
                        outcomeId,
                        userId: user.id,
                        amount,
                        token: "USDC", // Default to USDC as per checkout
                        status: 'PENDING', // Verified on-chain, logic pending result
                        txHash,
                        oddsAtPlacement: odds,
                        bookingCode: batchBookingCode
                    },
                    include: {
                        market: {
                            include: {
                                tournament: true,
                                outcomes: true
                            }
                        },
                        outcome: true
                    }
                });

                // 3. Update outcome totals
                await tx.bettingOutcome.update({
                    where: { id: outcomeId },
                    data: {
                        totalBets: { increment: amount },
                        betCount: { increment: 1 }
                    }
                });

                // 4. Update market pool
                await tx.bettingMarket.update({
                    where: { id: marketId },
                    data: {
                        totalPool: { increment: amount }
                    }
                });

                results.push(bet);
            }

            // Create a single notification for the batch
            await tx.notification.create({
                data: {
                    userId: user.id,
                    type: 'EARNING',
                    title: 'Batch Bets Confirmed',
                    message: `Successfully verified and placed ${bets.length} bets.`,
                    actionUrl: '/profile/bets'
                }
            });

            return results;
        }, { timeout: 30000 });

        // Trigger odds recalculation for affected markets (async)
        const uniqueMarketIds = Array.from(new Set(bets.map((b: any) => b.marketId)));
        uniqueMarketIds.forEach(marketId => {
            updateMarketWeights(marketId as string).catch(console.error);
        });

        return NextResponse.json({ success: true, bets: createdBets }, { status: 201 });

    } catch (error: any) {
        console.error('Error processing batch bets:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to process batch bets' },
            { status: 500 }
        );
    }
}
