
/**
 * Generates a short, human-readable booking code for betting slips.
 * Format: XXX-XXX-XXXX or similar.
 * Excludes confusing characters like 0, O, I, 1.
 */
export function generateBookingCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const getPart = (len: number) => {
        let res = '';
        for (let i = 0; i < len; i++) {
            res += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return res;
    };

    // Following the user's example format: X4RTTT-65F-THGF5T
    // We'll go with a slightly more standardized but similarly robust format
    return `${getPart(6)}-${getPart(3)}-${getPart(6)}`;
}
