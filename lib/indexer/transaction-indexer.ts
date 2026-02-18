/**
 * Transaction Indexer for PiggyVerse (Multi-Chain)
 * 
 * Monitors Base (PIGGY, USDC) and Ethereum (UP Token) for:
 * - Bet placements (Treasury deposits)
 * - Watch-to-earn claims
 */

import { prisma } from '@/lib/prisma';
import { createPublicClient, http, parseAbiItem, Log } from 'viem';
import { base, mainnet, baseSepolia } from 'viem/chains';
import { BLOCKCHAIN_CONFIG } from '@/lib/blockchain-config';

// Define ABI Items to watch
const DEPOSIT_EVENT = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)');
// Assuming standard ERC20 Transfer to Treasury = Deposit/Bet/Entry

interface ChainIndexerState {
    name: string;
    lastBlock: bigint;
    client: any; // Type as needed, simplified for brevity
    contracts: string[];
}

export class TransactionIndexer {
    private isRunning = false;

    // State for each chain
    private chains: ChainIndexerState[] = [];

    constructor() {
        this.initializeChains();
    }

    private initializeChains() {
        // Base Network (Primary)
        if (BLOCKCHAIN_CONFIG.RPC_URLS.BASE) {
            this.chains.push({
                name: 'BASE',
                lastBlock: BigInt(0),
                client: createPublicClient({
                    chain: base,
                    transport: http(BLOCKCHAIN_CONFIG.RPC_URLS.BASE)
                }),
                contracts: [
                    BLOCKCHAIN_CONFIG.CONTRACTS.PIGGY_TOKEN,
                    BLOCKCHAIN_CONFIG.CONTRACTS.USDC_TOKEN
                ]
            });
        }

        // Base Sepolia (Testnet)
        if (BLOCKCHAIN_CONFIG.RPC_URLS.BASE_SEPOLIA) {
            this.chains.push({
                name: 'BASE_SEPOLIA',
                lastBlock: BigInt(0),
                client: createPublicClient({
                    chain: baseSepolia,
                    transport: http(BLOCKCHAIN_CONFIG.RPC_URLS.BASE_SEPOLIA)
                }),
                contracts: [
                    BLOCKCHAIN_CONFIG.CONTRACTS.TUSDC_TOKEN
                ]
            });
        }

        // Ethereum Network (Secondary - UP Token)
        if (BLOCKCHAIN_CONFIG.RPC_URLS.ETH) {
            this.chains.push({
                name: 'ETH',
                lastBlock: BigInt(0),
                client: createPublicClient({
                    chain: mainnet,
                    transport: http(BLOCKCHAIN_CONFIG.RPC_URLS.ETH)
                }),
                contracts: [
                    BLOCKCHAIN_CONFIG.CONTRACTS.UP_TOKEN
                ]
            });
        }
    }

    async start() {
        if (this.isRunning) return;
        this.isRunning = true;
        console.log(`indexer: started monitoring ${this.chains.map(c => c.name).join(', ')}`);

        // Initialize latest blocks
        for (const chain of this.chains) {
            try {
                const block = await chain.client.getBlockNumber();
                chain.lastBlock = block - BigInt(10); // Start slightly behind
                console.log(`indexer: ${chain.name} starting from block ${chain.lastBlock}`);
            } catch (e) {
                console.error(`indexer: failed to connect to ${chain.name}`, e);
            }
        }

        this.pollTransactions();
    }

    stop() {
        this.isRunning = false;
        console.log('indexer: stopped');
    }

    private async pollTransactions() {
        while (this.isRunning) {
            const promises = this.chains.map(chain => this.processChain(chain));
            await Promise.all(promises);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }

    private async processChain(chain: ChainIndexerState) {
        try {
            const currentBlock = await chain.client.getBlockNumber();

            if (currentBlock <= chain.lastBlock) return;

            // Process efficiently: Max 100 blocks at a time
            const toBlock = currentBlock > chain.lastBlock + BigInt(100) ? chain.lastBlock + BigInt(100) : currentBlock;

            // console.log(`indexer: ${chain.name} scanning ${chain.lastBlock} -> ${toBlock}`);

            // Fetch Logs for all tracked tokens on this chain
            // Looking for Transfers TO the Treasury
            const logs = await chain.client.getLogs({
                address: chain.contracts as `0x${string}`[],
                event: DEPOSIT_EVENT,
                args: {
                    to: BLOCKCHAIN_CONFIG.CONTRACTS.PIGGYVERSE_MAIN as `0x${string}`
                },
                fromBlock: chain.lastBlock + BigInt(1),
                toBlock: toBlock
            });

            for (const log of logs) {
                await this.handleTransfer(log, chain.name);
            }

            chain.lastBlock = toBlock;

        } catch (error) {
            console.error(`indexer: error on ${chain.name}`, error);
        }
    }

    private async handleTransfer(log: any, chainName: string) {
        const txHash = log.transactionHash;
        const from = log.args.from;
        const value = log.args.value;
        const token = log.address;

        console.log(`indexer: detected transfer on ${chainName}: ${value} from ${from} (tx: ${txHash})`);

        // Check if this transfer matches a PENDING BET
        // We match by amount (approximate or exact?) and ideally sender, but mostly amount for MVP
        // PENDING ISSUE: Users might send same amount. 
        // PRODUCTION FIX: Use `memo` field or dedicated contract method `deposit(betId)`.
        // MVP FIX: Find oldest pending bet with this amount.

        // TODO: Normalize raw value (wei) to decimal string for DB match
        // Assuming DB stores decimals (e.g. 10.5) and blockchain uses wei.
        // Needs token decimals lookup. MVP: Assuming 18 decimals for now (PIGGY/UP) or 6 for USDC.

        // For MVP, we'll confirm bets found by TX Hash if user manually entered it,
        // OR we try to match by exact amount if valid.

        // Let's assume the user has already called the API to place a bet, and we are waiting for payment.
        // We look for a bet with status 'PENDING' for this user? We don't know the user from `from` address easily without mapping.

        // Simplification: Just log it for now as "Funds Received".
        // Real implementation requires user to sign a message or call a specific contract function.
    }
}

export const transactionIndexer = new TransactionIndexer();
