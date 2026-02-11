/**
 * Calculate Global Rank based on 50/35/15 weighting
 * @param effort - Effort score (50% weight)
 * @param proficiency - Proficiency score (35% weight)
 * @param activity - Activity score (15% weight)
 * @returns Weighted global rank score
 */
export function calculateGlobalRank(
    effort: number,
    proficiency: number,
    activity: number
): number {
    return (effort * 0.5) + (proficiency * 0.35) + (activity * 0.15);
}

/**
 * Settlement formula: Net Pool = [Total Bets + Seed] × [1 - Fee]
 */
export function calculateNetPool(
    totalBets: number,
    seed: number,
    feePercentage: number
): number {
    return (totalBets + seed) * (1 - feePercentage);
}
