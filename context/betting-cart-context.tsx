"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface BetSelection {
    marketId: string;
    outcomeId: string;
    marketQuestion: string;
    outcomeLabel: string;
    odds: number;
    tournamentId: string;
    tournamentName: string;
    amount: number;
    token: string;
}

interface BettingCartContextType {
    items: BetSelection[];
    addToSlip: (item: BetSelection) => void;
    removeFromSlip: (outcomeId: string) => void;
    updateAmount: (outcomeId: string, amount: number) => void;
    updateOdds: (outcomeId: string, newOdds: number) => void;
    clearSlip: () => void;
    totalWager: number;
    itemCount: number;
    isInSlip: (outcomeId: string) => boolean;
    cartToken: string | null;
}



const BettingCartContext = createContext<BettingCartContextType | undefined>(undefined);

export function BettingCartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<BetSelection[]>([]);

    // Persistence: Load from LocalStorage
    useEffect(() => {
        const saved = localStorage.getItem('piggy_betting_slip');
        if (saved) {
            try {
                setItems(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to load betting slip", e);
            }
        }
    }, []);

    // Persistence: Save to LocalStorage
    useEffect(() => {
        localStorage.setItem('piggy_betting_slip', JSON.stringify(items));
    }, [items]);

    const addToSlip = (item: BetSelection) => {
        setItems(prev => {
            // Check for existing items
            if (prev.length > 0) {
                const currentToken = prev[0].token || 'USDC';
                const newToken = item.token || 'USDC';

                // Auto-clear if token mismatch (enforce single-token cart)
                if (currentToken !== newToken) {
                    return [item];
                }
            }

            if (prev.find(i => i.outcomeId === item.outcomeId)) return prev;
            return [...prev, item];
        });
    };

    const removeFromSlip = (outcomeId: string) => {
        setItems(prev => prev.filter(i => i.outcomeId !== outcomeId));
    };

    const updateAmount = (outcomeId: string, amount: number) => {
        setItems(prev => prev.map(item =>
            item.outcomeId === outcomeId ? { ...item, amount: Math.max(0, amount) } : item
        ));
    };

    const updateOdds = (outcomeId: string, newOdds: number) => {
        setItems(prev => prev.map(item =>
            item.outcomeId === outcomeId ? { ...item, odds: newOdds } : item
        ));
    };

    const clearSlip = () => setItems([]);

    const isInSlip = (outcomeId: string) => items.some(i => i.outcomeId === outcomeId);

    const totalWager = items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const itemCount = items.length;

    return (
        <BettingCartContext.Provider value={{
            items,
            addToSlip,
            removeFromSlip,
            updateAmount,
            updateOdds,
            clearSlip,
            totalWager,
            itemCount,
            isInSlip,
            cartToken: items.length > 0 ? (items[0].token || 'USDC') : null
        }}>
            {children}
        </BettingCartContext.Provider>
    );
}

export function useBettingCart() {
    const context = useContext(BettingCartContext);
    if (context === undefined) {
        throw new Error('useBettingCart must be used within a BettingCartProvider');
    }
    return context;
}
