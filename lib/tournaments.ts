
/**
 * Centralized Tournament Logic
 */

import { Tournament } from "@prisma/client";

/**
 * Calculate the live prize pool for a tournament.
 * 
 * Logic:
 * Prize Pool = Seed Amount + (Confirmed Registrations * Entry Fee)
 * 
 * @param tournament The tournament object (must include basic fields)
 * @param entryFeeAmount The entry fee amount (optional, defaults to tournament.entryFeeAmount)
 * @param registeredCount The number of registered players (optional, defaults to tournament.registeredPlayers)
 * @param seedAmount The seed amount (optional, defaults to tournament.prizePoolSeed or prizePoolAmount if seed is missing)
 */
export function calculateLivePrizePool(
    tournament: {
        prizePoolSeed?: number | null;
        prizePoolAmount?: number | null;
        entryFeeAmount?: number | null;
        registeredPlayers?: number;
        // Allow for extended properties if passed
        [key: string]: any;
    },
    registeredCount?: number
): number {
    const seed = tournament.prizePoolSeed ?? tournament.prizePoolAmount ?? 0;
    const fee = tournament.entryFeeAmount ?? 0;
    const count = registeredCount ?? tournament.registeredPlayers ?? 0;

    // Revenue from players
    const revenue = count * fee;

    return seed + revenue;
}
