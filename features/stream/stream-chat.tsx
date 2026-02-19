"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Smile, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSession } from "next-auth/react";
import { useStreamChat } from "@/hooks/use-stream-chat";

interface StreamChatProps {
    streamId?: string;
}

export function StreamChat({ streamId }: StreamChatProps) {
    const { data: session } = useSession();
    const [inputValue, setInputValue] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const [isSending, setIsSending] = useState(false);

    // Use real-time WebSocket hook
    const { messages, sendMessage, isConnected } = useStreamChat(streamId || '');

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages.length]);

    const handleSendMessage = async () => {
        if (!inputValue.trim() || !session || !streamId) return;

        setIsSending(true);
        try {
            await sendMessage(inputValue);
            setInputValue("");
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setIsSending(false);
        }
    };

    // Helper to generate consistent colors from username
    const getUsernameColor = (username: string) => {
        const colors = ["#FF6B9D", "#9D6BFF", "#6BFFD1", "#FFD16B", "#FF6B6B", "#6BBAFF", "#BA6BFF"];
        let hash = 0;
        for (let i = 0; i < username.length; i++) {
            hash = username.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    const formatTime = (isoString: string) => {
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="bg-black/60 backdrop-blur-3xl border border-white/10 rounded-2xl h-full flex flex-col overflow-hidden">
            {/* Chat Header */}
            <div className="p-4 border-b border-white/10 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-piggy-body font-bold text-white font-mono">Live Chat</h3>
                        <p className="text-piggy-label text-gray-400 font-mono mt-0.5">
                            {streamId ? `${messages.length} messages` : "Connecting..."}
                        </p>
                    </div>
                    {/* Connection indicator */}
                    <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-500'}`} />
                        <span className="text-piggy-tiny text-gray-400 font-mono">
                            {isConnected ? 'Live' : 'Offline'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Messages - Scrollable */}
            <ScrollArea className="flex-1 min-h-0" ref={scrollRef}>
                <div className="p-4 space-y-3">
                    {messages.map((msg) => (
                        <div key={msg.id} className="group animate-in fade-in slide-in-from-bottom-2 duration-200">
                            <div className="flex items-start gap-2">
                                <div
                                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-piggy-tiny text-white uppercase"
                                    style={{ backgroundColor: getUsernameColor(msg.username) }}
                                >
                                    {msg.username[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline gap-1.5 mb-0.5">
                                        <span
                                            className="font-bold text-piggy-label font-mono"
                                            style={{ color: getUsernameColor(msg.username) }}
                                        >
                                            {msg.username}
                                        </span>
                                        <span className="text-piggy-tiny text-gray-500 font-mono">
                                            {formatTime(msg.createdAt)}
                                        </span>
                                    </div>
                                    <p className="text-white text-piggy-body break-words">{msg.message}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                    <div ref={bottomRef} />
                </div>
            </ScrollArea>

            {/* Chat Input - Fixed at bottom */}
            <div className="p-4 border-t border-white/10 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Input
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                            placeholder={session ? "Send a message..." : "Sign in to chat"}
                            disabled={!session || !streamId || isSending}
                            className="bg-white/5 border-white/10 text-white text-piggy-body placeholder:text-gray-500 pr-8 rounded-full h-9 font-mono disabled:opacity-50"
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-0.5 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full hover:bg-white/10"
                            disabled={!session}
                        >
                            <Smile className="w-3.5 h-3.5 text-gray-400" />
                        </Button>
                    </div>
                    <Button
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim() || !session || !streamId || isSending}
                        className="bg-[var(--color-piggy-deep-pink)] hover:bg-[var(--color-piggy-deep-pink)]/90 text-white rounded-full h-9 w-9 p-0 disabled:opacity-50"
                    >
                        {isSending ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <Send className="w-3.5 h-3.5" />
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
