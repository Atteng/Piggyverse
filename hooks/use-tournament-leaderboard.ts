"use client";

import { useEffect, useState } from 'react';
import { supabaseClient } from '@/lib/supabase-client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface LeaderboardEntry {
    id: string;
    userId: string;
    username: string;
    avatarUrl: string | null;
    score: number;
    rank: number;
}

export function useTournamentLeaderboard(tournamentId: string) {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        let channel: RealtimeChannel;

        // Fetch initial leaderboard
        const fetchLeaderboard = async () => {
            const response = await fetch(`/api/leaderboards?tournamentId=${tournamentId}`);
            if (response.ok) {
                const data = await response.json();
                setEntries(data.entries || []);
            }
        };

        fetchLeaderboard();

        // Subscribe to real-time updates
        channel = supabaseClient
            .channel(`tournament:${tournamentId}:leaderboard`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'leaderboard_entries',
                    filter: `tournament_id=eq.${tournamentId}`
                },
                () => {
                    // Refetch leaderboard on any change
                    fetchLeaderboard();
                }
            )
            .subscribe((status) => {
                setIsConnected(status === 'SUBSCRIBED');
            });

        return () => {
            channel.unsubscribe();
        };
    }, [tournamentId]);

    return {
        entries,
        isConnected
    };
}
