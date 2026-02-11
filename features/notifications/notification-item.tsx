"use client";

import { motion } from "framer-motion";
import { Trophy, Coins, Settings, Bell, ChevronRight, Swords, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type NotificationType = "tournament" | "earning" | "system" | "social";

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
    actionUrl?: string;
    actionLabel?: string;
    amount?: number;
}

interface NotificationItemProps {
    notification: Notification;
}

export function NotificationItem({ notification }: NotificationItemProps) {
    const getIcon = () => {
        switch (notification.type) {
            case "tournament":
                return <Swords className="w-5 h-5 text-white" />;
            case "earning":
                return <Coins className="w-5 h-5 text-white" />;
            case "system":
                return <Settings className="w-5 h-5 text-white" />;
            default:
                return <Bell className="w-5 h-5 text-white" />;
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);

        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "group relative overflow-hidden rounded-xl border border-white/5 p-3 transition-all duration-300",
                notification.read
                    ? "bg-black/20 hover:bg-black/40 hover:border-white/10"
                    : "bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20"
            )}
        >
            {/* Unread Indicator */}
            {!notification.read && (
                <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
            )}

            <div className="flex items-start gap-3">
                {/* Icon Box - More Compact */}
                <div className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm transition-colors group-hover:bg-white/10",
                )}>
                    {getIcon()}
                </div>

                <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center justify-between gap-4 mb-0.5">
                        <h3 className={cn(
                            "text-sm font-bold truncate pr-6",
                            notification.read ? "text-gray-200" : "text-white"
                        )}>
                            {notification.title}
                        </h3>
                        <span className="text-[10px] font-mono text-gray-500 whitespace-nowrap shrink-0">
                            {formatTime(notification.timestamp)}
                        </span>
                    </div>

                    <p className="text-xs text-gray-400 leading-relaxed max-w-[95%] mb-2">
                        {notification.message}
                    </p>

                    {/* Action Area - Compact */}
                    {(notification.actionLabel || notification.amount) && (
                        <div className="flex items-center gap-2 mt-1.5">
                            {notification.actionLabel && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-2.5 bg-white/5 border-white/10 hover:bg-white/10 text-white hover:text-white text-[10px] font-bold rounded-md group/btn"
                                >
                                    {notification.actionLabel}
                                    <ChevronRight className="w-2.5 h-2.5 ml-1 opacity-50 group-hover/btn:translate-x-0.5 transition-transform" />
                                </Button>
                            )}

                            {notification.amount && (
                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/5 border border-white/10 rounded-md">
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Amount</span>
                                    <div className="w-px h-2.5 bg-white/10" />
                                    <span className="text-white font-mono text-[10px] font-bold">
                                        {notification.amount.toLocaleString()}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
