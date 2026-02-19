import { NextRequest, NextResponse } from "next/server";
import { pokerVerifier } from "@/lib/poker-verifier";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ tableId: string; handNumber: string }> }
) {
    try {
        const { tableId, handNumber } = await params;
        const handNum = parseInt(handNumber, 10);

        if (isNaN(handNum)) {
            return NextResponse.json({ error: "Invalid hand number" }, { status: 400 });
        }

        const logs = await pokerVerifier.fetchHand(tableId, handNum);

        if (!logs) {
            return NextResponse.json({ error: "Hand not found" }, { status: 404 });
        }

        return NextResponse.json({ logs });

    } catch (error) {
        console.error("Error fetching hand logs:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
