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
    const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        let channel: RealtimeChannel;

        // Fetch initial leaderboard
        const fetchLeaderboard = async () => {
            try {
                const response = await fetch(`/api/leaderboard?tournamentId=${tournamentId}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data && Array.isArray(data.entries)) {
                        setLeaderboardData(data.entries);
                    } else {
                        // Safely handle missing entries
                        setLeaderboardData([]);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch leaderboard", error);
                setLeaderboardData([]);
            }
        };

        fetchLeaderboard();

        // Subscribe to real-time updates
        if (supabaseClient) {
            try {
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
            } catch (err) {
                console.error("Supabase subscription error:", err);
            }
        }

        return () => {
            if (channel) channel.unsubscribe();
        };
    }, [tournamentId]);

    return {
        entries: leaderboardData,
        isConnected
    };
}
