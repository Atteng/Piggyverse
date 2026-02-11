"use client";

import { useEffect, useState } from 'react';
import { supabaseClient } from '@/lib/supabase-client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface BettingOdds {
    outcomeId: string;
    label: string;
    currentOdds: number;
    totalBets: number;
    betCount: number;
}

export function useBettingOdds(marketId: string) {
    const [odds, setOdds] = useState<BettingOdds[]>([]);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        let channel: RealtimeChannel;

        // Fetch initial odds
        const fetchOdds = async () => {
            const response = await fetch(`/api/betting/markets/${marketId}/odds`);
            if (response.ok) {
                const data = await response.json();
                setOdds(data.outcomes || []);
            }
        };

        fetchOdds();

        // Subscribe to real-time bet placements
        channel = supabaseClient
            .channel(`market:${marketId}:odds`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'bets',
                    filter: `market_id=eq.${marketId}`
                },
                () => {
                    // Refetch odds when new bet is placed
                    fetchOdds();
                }
            )
            .subscribe((status) => {
                setIsConnected(status === 'SUBSCRIBED');
            });

        return () => {
            channel.unsubscribe();
        };
    }, [marketId]);

    return {
        odds,
        isConnected
    };
}
