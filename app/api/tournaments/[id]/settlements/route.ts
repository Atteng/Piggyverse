import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSettlementMatrix } from "@/lib/ai/payout-parser";

export async function GET(
    request: Request,
    context: { params: { id: string } }
) {
    try {
        const params = await Promise.resolve(context.params);
        if (!params || !params.id) {
            return NextResponse.json({ error: "Tournament ID is required" }, { status: 400 });
        }

        const tournamentId = params.id;

        // 1. Fetch the completed tournament with its prize distribution rules
        const tournament = await prisma.tournament.findUnique({
            where: { id: tournamentId },
            include: {
                // @ts-ignore - finalRank exists in schema but Prisma Client needs regeneration
                registrations: {
                    include: {
                        user: { select: { username: true } },
                    },
                    orderBy: { finalRank: 'asc' }
                }
            }
        });

        if (!tournament) {
            return NextResponse.json({ error: "Tournament not found for JSON export" }, { status: 404 });
        }

        if (tournament.status !== 'COMPLETED') {
            return NextResponse.json({ error: "Tournament must be COMPLETED to generate a final settlement" }, { status: 400 });
        }

        // 2. Identify players and fetch their payment wallets
        // We look up the `TransactionReceipt` using the `txHash` recorded at registration
        // (Free tournaments won't have a txHash, we can fallback to something else if needed)

        // Initialize viem client for fallback lookups
        const { createPublicClient, http } = await import('viem');
        const { base } = await import('viem/chains');
        const client = createPublicClient({ chain: base, transport: http() });

        // @ts-ignore
        const registrationRows = tournament.registrations || [];
        const txHashes = registrationRows.map((r: any) => r.txHash).filter(Boolean) as string[];

        let receipts: any[] = [];
        if (txHashes.length > 0) {
            receipts = await prisma.transactionReceipt.findMany({
                where: { txHash: { in: txHashes } },
                select: { txHash: true, fromAddress: true }
            });
        }

        const rankedPlayers = await Promise.all(registrationRows.map(async (reg: any) => {
            let walletAddress = receipts.find(r => r.txHash === reg.txHash)?.fromAddress;

            // FALLBACK: If DB receipt is missing but txHash exists, look it up on-chain
            if (!walletAddress && reg.txHash) {
                try {
                    console.log(`[Settlement-Fallback] Looking up tx on-chain: ${reg.txHash}`);
                    const receipt = await client.getTransactionReceipt({ hash: reg.txHash as `0x${string}` });
                    walletAddress = receipt.from.toLowerCase();

                    // Optional: Backfill the DB so we don't have to look it up again
                    await prisma.transactionReceipt.create({
                        data: {
                            txHash: reg.txHash,
                            fromAddress: walletAddress,
                            amount: reg.expectedAmount || 0,
                            token: tournament.entryFeeToken || "PIGGY",
                            type: 'ENTRY_FEE',
                            referenceId: tournamentId,
                            status: 'VERIFIED',
                            verifiedAt: new Date()
                        }
                    }).catch(() => { }); // Ignore duplicates
                } catch (e) {
                    console.error(`[Settlement-Fallback] Failed to fetch receipt for ${reg.txHash}:`, e);
                }
            }

            return {
                username: reg.user.username || "Unknown",
                rank: reg.finalRank || 999,
                walletAddress: walletAddress || "WALLET_NOT_FOUND (Free Entry / Off-Chain)"
            };
        }));

        // 3. Extract prize configuration
        const totalPrizePool = tournament.prizePoolAmount || 0;
        const prizeToken = tournament.prizePoolToken || tournament.entryFeeToken || "PIGGY";

        // prizeDistribution might be a string like "1st 50%, 2nd 30%" or a JSON object. We stringify it for the AI.
        const distributionRules = typeof tournament.prizeDistribution === 'string'
            ? tournament.prizeDistribution
            : JSON.stringify(tournament.prizeDistribution || "Winner Takes All");

        // 4. Ask Gemini AI to generate the exact payout matrix
        const settlementMatrix = await generateSettlementMatrix(
            tournamentId,
            distributionRules,
            totalPrizePool,
            prizeToken,
            rankedPlayers
        );

        // 5. Send back the raw JSON document
        return NextResponse.json(settlementMatrix);

    } catch (error) {
        console.error("[AI Settlement Generation Error]:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to generate settlement" },
            { status: 500 }
        );
    }
}
