
/**
 * Token Pricing Oracle for PiggyVerse
 * Fetches live pricing from DexScreener for tokens on Base network
 */

const TOKEN_CONTRACTS: Record<string, string> = {
    PIGGY: (process.env.NEXT_PUBLIC_CONTRACT_PIGGY_TOKEN || '0x5de060417cd924a350eff55375357db5c24e9411').split('#')[0].replace(/['"]/g, '').trim().toLowerCase(),
    USDC: (process.env.NEXT_PUBLIC_CONTRACT_USDC || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913').split('#')[0].replace(/['"]/g, '').trim().toLowerCase(),
    UP: (process.env.NEXT_PUBLIC_CONTRACT_UP_TOKEN || '0x5de060417cd924a350eff55375357db5c24e9411').split('#')[0].replace(/['"]/g, '').trim().toLowerCase(), // Example address
};

// Cache for token prices to avoid excessive API calls
interface PriceCache {
    price: number;
    timestamp: number;
}

const priceCache: Record<string, PriceCache> = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetches the USD price of a token using DexScreener API
 */
export async function fetchTokenPrice(tokenSymbol: string): Promise<number> {
    const symbol = tokenSymbol.toUpperCase();
    const address = TOKEN_CONTRACTS[symbol];

    if (!address) {
        console.warn(`Price Oracle: No contract address found for ${symbol}`);
        return symbol === 'USDC' ? 1.0 : 0;
    }

    // Check cache
    const cached = priceCache[symbol];
    if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
        return cached.price;
    }

    try {
        // Special case for USDC
        if (symbol === 'USDC') return 1.0;

        const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${address}`);
        if (!response.ok) throw new Error(`API error: ${response.statusText}`);

        const data = await response.json();
        const pair = data.pairs?.[0]; // Get the most liquid pair

        if (!pair?.priceUsd) {
            console.warn(`Price Oracle: No price data found for ${symbol} at ${address}`);
            return 0;
        }

        const price = parseFloat(pair.priceUsd);

        // Update cache
        priceCache[symbol] = {
            price,
            timestamp: Date.now()
        };

        return price;
    } catch (error) {
        console.error(`Price Oracle: Failed to fetch price for ${symbol}:`, error);
        // Fallback to cache even if expired if fetch fails
        return cached?.price || 0;
    }
}

/**
 * Gets values for multiple tokens at once
 */
export async function getUSDValue(tokenSymbol: string, amount: number): Promise<number> {
    const price = await fetchTokenPrice(tokenSymbol);
    return amount * price;
}
