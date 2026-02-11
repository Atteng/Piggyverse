"use client";

import { useEffect, useState } from 'react';
import { supabaseClient } from '@/lib/supabase-client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface ChatMessage {
    id: string;
    streamId: string;
    userId: string;
    username: string;
    avatarUrl: string | null;
    message: string;
    createdAt: string;
}

export function useStreamChat(streamId: string) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        let channel: RealtimeChannel;

        // Fetch initial messages
        const fetchMessages = async () => {
            const response = await fetch(`/api/streams/${streamId}/chat`);
            if (response.ok) {
                const data = await response.json();
                setMessages(data.messages || []);
            }
        };

        fetchMessages();

        // Subscribe to real-time updates
        channel = supabaseClient
            .channel(`stream:${streamId}:chat`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: `stream_id=eq.${streamId}`
                },
                (payload) => {
                    const newMessage = payload.new as any;
                    setMessages((prev) => [...prev, {
                        id: newMessage.id,
                        streamId: newMessage.stream_id,
                        userId: newMessage.user_id,
                        username: newMessage.username,
                        avatarUrl: newMessage.avatar_url,
                        message: newMessage.message,
                        createdAt: newMessage.created_at
                    }]);
                }
            )
            .subscribe((status) => {
                setIsConnected(status === 'SUBSCRIBED');
            });

        return () => {
            channel.unsubscribe();
        };
    }, [streamId]);

    const sendMessage = async (message: string) => {
        try {
            const response = await fetch(`/api/streams/${streamId}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });

            if (!response.ok) {
                throw new Error('Failed to send message');
            }

            return await response.json();
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    };

    return {
        messages,
        sendMessage,
        isConnected
    };
}
