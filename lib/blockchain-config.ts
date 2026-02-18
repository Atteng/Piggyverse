/**
 * Blockchain Configuration for PiggyVerse
 * 
 * All configuration is loaded from environment variables.
 * See .env.example for all available settings.
 */

export const BLOCKCHAIN_CONFIG = {
    // Network Configuration
    NETWORK: process.env.NEXT_PUBLIC_BLOCKCHAIN_NETWORK!,
    CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID!,

    // RPC Provider
    RPC_URL: process.env.BLOCKCHAIN_RPC_URL!,
    RPC_URLS: {
        BASE: process.env.BASE_RPC_URL!,
        BASE_SEPOLIA: process.env.BASE_SEPOLIA_RPC_URL!,
        ETH: process.env.ETH_RPC_URL!,
        ETH_SEPOLIA: process.env.ETH_SEPOLIA_RPC_URL!,
    },

    // Smart Contract Addresses
    CONTRACTS: {
        PIGGYVERSE_MAIN: process.env.NEXT_PUBLIC_CONTRACT_PIGGYVERSE!,
        PIGGY_TOKEN: process.env.NEXT_PUBLIC_CONTRACT_PIGGY_TOKEN!,
        UP_TOKEN: process.env.NEXT_PUBLIC_CONTRACT_UP_TOKEN!,
        USDC_TOKEN: process.env.NEXT_PUBLIC_CONTRACT_USDC!,
        TUSDC_TOKEN: process.env.NEXT_PUBLIC_CONTRACT_TUSDC!,
        WATCH_TO_EARN: process.env.NEXT_PUBLIC_CONTRACT_WATCH_TO_EARN!,
    },

    // Indexer Configuration
    INDEXER: {
        POLL_INTERVAL: parseInt(process.env.INDEXER_POLL_INTERVAL || '5000'),
        BLOCKS_PER_BATCH: parseInt(process.env.INDEXER_BLOCKS_PER_BATCH || '100'),
        START_BLOCK: parseInt(process.env.INDEXER_START_BLOCK || '0'),
    },

    // Supported tokens
    SUPPORTED_TOKENS: (process.env.NEXT_PUBLIC_SUPPORTED_TOKENS || 'PIGGY,USDC,MATIC').split(',') as readonly string[],
};

export type SupportedToken = typeof BLOCKCHAIN_CONFIG.SUPPORTED_TOKENS[number];

/**
 * Server-side Admin Configuration
 * WARNING: These are only available on the server. Never expose to client.
 */
export const ADMIN_CONFIG = {
    PRIVATE_KEY: process.env.ADMIN_PRIVATE_KEY,
    WALLET_ADDRESS: process.env.ADMIN_WALLET_ADDRESS,
    ADMIN_EMAILS: (process.env.ADMIN_EMAILS || '').split(',').filter(Boolean),
};

/**
 * Contract ABIs (simplified - add full ABIs when contracts are deployed)
 */
export const CONTRACT_ABIS = {
    PIGGYVERSE_MAIN: [
        'event BetPlaced(address indexed user, bytes32 indexed marketId, uint256 amount, string token)',
        'event TournamentEntryPaid(address indexed user, bytes32 indexed tournamentId, uint256 amount)',
        'event PrizeDistributed(address indexed winner, bytes32 indexed tournamentId, uint256 amount)',
    ],

    WATCH_TO_EARN: [
        'event RewardClaimed(address indexed user, uint256 amount, uint256 sessionId)',
        'event SessionRecorded(address indexed user, uint256 sessionId, uint256 duration, uint256 points)',
    ],

    ERC20: [
        'function balanceOf(address owner) view returns (uint256)',
        'function transfer(address to, uint256 amount) returns (bool)',
        'event Transfer(address indexed from, address indexed to, uint256 value)',
    ],
};
