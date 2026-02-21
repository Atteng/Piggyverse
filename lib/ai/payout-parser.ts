import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini client
const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

export interface PlayerSettlement {
    walletAddress: string;
    username: string;
    rank: number;
    payoutAmount: number;
    payoutToken: string;
}

export interface SettlementMatrix {
    tournamentId: string;
    totalPrizePool: number;
    prizeToken: string;
    payouts: PlayerSettlement[];
    aiConfidence: string;
    reasoning: string;
}

/**
 * Uses Gemini AI to parse a natural language prize distribution description
 * and map the exact token payouts to the final ranked list of players.
 */
export async function generateSettlementMatrix(
    tournamentId: string,
    prizeDistributionText: string,
    totalPrizePool: number,
    prizeToken: string,
    rankedPlayers: Array<{ username: string, walletAddress: string, rank: number }>
): Promise<SettlementMatrix> {

    if (!apiKey) {
        throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not configured.");
    }

    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash-lite",
        generationConfig: {
            responseMimeType: "application/json",
        }
    });

    const prompt = `
        You are a highly precise Web3 tournament settlement oracle. 
        Your job is to read a natural language "Prize Distribution" rule created by a tournament host, 
        and calculate the EXACT numeric payout each player receives based on their final rank.

        TOURNAMENT DATA:
        - Total Prize Pool: ${totalPrizePool} ${prizeToken}
        - Host's Prize Rules: "${prizeDistributionText || 'Winner takes all'}"
        
        PLAYER ROSTER (Ordered by 1st place to last):
        ${JSON.stringify(rankedPlayers, null, 2)}

        CALCULATION RULES:
        1. Read the Host's Prize Rules carefully.
        2. Apply those percentage or fixed-amount rules to the Total Prize Pool.
        3. Match the calculated payouts to the players based on their "rank".
        4. If the rules say "Winner takes all", allocate 100% of the pool to Rank 1.
        5. If a player does not qualify for a prize, their payoutAmount must be 0.
        6. The sum of all payoutAmounts MUST NOT exceed the Total Prize Pool.

        OUTPUT FORMAT:
        You must return a strict JSON object that exactly matches this TypeScript interface:
        {
            "tournamentId": "${tournamentId}",
            "totalPrizePool": ${totalPrizePool},
            "prizeToken": "${prizeToken}",
            "aiConfidence": "HIGH or LOW based on if the math perfectly matches the rules",
            "reasoning": "A short, 1-sentence explanation of how you mapped the rules to the players",
            "payouts": [
                {
                    "walletAddress": "0x...",
                    "username": "...",
                    "rank": 1,
                    "payoutAmount": 1000.50,
                    "payoutToken": "${prizeToken}"
                }
            ]
        }
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        // Ensure it's valid JSON
        const parsedMatrix = JSON.parse(text) as SettlementMatrix;
        return parsedMatrix;

    } catch (error) {
        console.error("AI Settlement Generation Failed:", error);
        throw new Error("Failed to generate AI settlement matrix: " + (error instanceof Error ? error.message : "Unknown AI error"));
    }
}
