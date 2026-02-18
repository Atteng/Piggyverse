/**
 * Utility to extract PokerNow table ID from lobby URL
 */

/**
 * Extract table ID from PokerNow URL
 * Supports formats:
 * - https://www.pokernow.com/games/pglfaXOkp2qioU-nyVC1za8Zc
 * - https://www.pokernow.com/mtt/superpoker-84-KosRW9pf1c/audit-log
 */
export function extractPokerNowTableId(url: string): string | null {
    if (!url) return null;

    try {
        const urlObj = new URL(url);

        // Format 1: Direct game URL
        // https://www.pokernow.com/games/{TABLE_ID}
        const gameMatch = urlObj.pathname.match(/\/games\/([a-zA-Z0-9_-]+)/);
        if (gameMatch) {
            return gameMatch[1];
        }

        // Format 2: MTT URL (tournament ID, not table ID)
        // https://www.pokernow.com/mtt/{TOURNAMENT_ID}/...
        const mttMatch = urlObj.pathname.match(/\/mtt\/([a-zA-Z0-9_-]+)/);
        if (mttMatch) {
            return mttMatch[1]; // Store tournament ID, will need to fetch table IDs later
        }

        return null;
    } catch (error) {
        console.error('Failed to parse PokerNow URL:', error);
        return null;
    }
}

/**
 * Extract tournament ID from PokerNow MTT URL
 */
export function extractPokerNowTournamentId(url: string): string | null {
    if (!url) return null;

    try {
        const urlObj = new URL(url);
        const mttMatch = urlObj.pathname.match(/\/mtt\/([a-zA-Z0-9_-]+)/);
        return mttMatch ? mttMatch[1] : null;
    } catch (error) {
        return null;
    }
}

/**
 * Determine if URL is a PokerNow URL
 */
export function isPokerNowUrl(url: string): boolean {
    if (!url) return false;

    try {
        const urlObj = new URL(url);
        return urlObj.hostname === 'www.pokernow.com' || urlObj.hostname === 'pokernow.com';
    } catch (error) {
        return false;
    }
}
