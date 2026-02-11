export type MarketType = 'PARIMUTUEL' | 'WEIGHTED' | 'BINARY' | 'SCORE';

export type TokenType = 'UP' | 'PIGGY';

export interface Event {
    id: string;
    name: string;
    description?: string;
    startTime: Date;
    bettingLockTime: Date;
    resolutionTime: Date;
    isPublic: boolean;
    restrictParticipants: boolean;
    status: 'DRAFT' | 'PUBLISHED' | 'LOCKED' | 'RESOLVED';
}

export interface Market {
    id: string;
    eventId: string;
    question: string;
    type: MarketType;
    minBet: number;
    maxBet: number;
    protocolFee: number;
    daoSeed: number;
    tokenType: TokenType;
    status: 'DRAFT' | 'PUBLISHED' | 'LOCKED' | 'RESOLVED';
}

export interface Outcome {
    id: string;
    marketId: string;
    label: string;
    weight?: number; // For weighted markets
    totalStaked: number;
}

export interface Bet {
    id: string;
    userId: string;
    marketId: string;
    outcomeId?: string;
    amount: number;
    tokenType: TokenType;
    txHash: string;
    timestamp: Date;
    status: 'PENDING' | 'CONFIRMED' | 'SETTLED';
}

export interface Tournament {
    id: string;
    name: string;
    gameId: string;
    hostId: string;
    tokenType: TokenType;
    entryFee: number;
    prizePool: number;
    startTime: Date;
    endTime: Date;
    maxParticipants?: number;
    status: 'DRAFT' | 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';
}
