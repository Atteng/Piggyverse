/**
 * Example: Integrate PokerNow verification with tournament settlement
 * 
 * This shows how to automatically verify and settle bets when a tournament ends
 */

import { settleTournamentBets } from '@/lib/tournaments';

/**
 * Example API route: POST /api/tournaments/[id]/verify
 */
export async function POST(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const result = await settleTournamentBets(id);

        return Response.json({
            success: true,
            result,
        });
    } catch (error) {
        return Response.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
