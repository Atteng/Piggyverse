import { NextResponse } from "next/server";
import { settleTournamentBets } from "@/lib/tournaments";

export async function POST(
    request: Request,
    context: { params: { id: string } }
) {
    try {
        const params = await Promise.resolve(context.params);
        if (!params || !params.id) {
            return NextResponse.json({ error: "Tournament ID is required" }, { status: 400 });
        }

        const tournamentId = params.id;

        // Ensure this is explicitly triggering the Full CSV parsing bypass,
        // rather than the incremental polling JSON engine.
        const useFullCSV = true;

        const result = await settleTournamentBets(tournamentId, useFullCSV);

        if (!result.verified) {
            return NextResponse.json({ error: result.verificationError || "Failed to verify tournament" }, { status: 400 });
        }

        return NextResponse.json({ success: true, result });
    } catch (error) {
        console.error("[Tournament Full Verify/Settle API Error]:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to sync tournament results" },
            { status: 500 }
        );
    }
}
