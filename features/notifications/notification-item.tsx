"use client";

import { motion } from "framer-motion";
import { Trophy, Coins, Settings, Bell, ChevronRight, Swords, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

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
                "group relative overflow-hidden rounded-[1.25rem] border border-white/5 p-4 transition-all duration-300 w-full max-w-full",
                notification.read
                    ? "bg-black/40 backdrop-blur-3xl hover:bg-black/60 hover:border-white/10"
                    : "bg-black/60 border-white/20 hover:border-white/30 backdrop-blur-3xl"
            )}
        >
            {/* Unread Indicator - Pink Glow */}
            {!notification.read && (
                <div className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-[var(--color-piggy-deep-pink)] shadow-[0_0_8px_var(--color-piggy-deep-pink)] animate-pulse" />
            )}

            <div className="flex items-start gap-3">
                {/* Icon Box - Standardized Radius */}
                <div className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/5 bg-black/40 backdrop-blur-sm transition-colors group-hover:bg-white/5",
                )}>
                    {getIcon()}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-4 mb-2">
                        <h3 className={cn(
                            "text-sm font-black font-mono tracking-tighter leading-[0.7] truncate uppercase",
                            notification.read ? "text-white/60" : "text-white"
                        )}>
                            {notification.title}
                        </h3>
                        <span className="text-[9px] font-mono font-bold text-white/20 whitespace-nowrap shrink-0 uppercase tracking-widest">
                            {formatTime(notification.timestamp)}
                        </span>
                    </div>

                    <p className="text-[10px] text-white/40 font-medium leading-relaxed max-w-[95%] mb-2 break-words">
                        {notification.message}
                    </p>

                    {/* Action Area - Standardized */}
                    {(notification.actionLabel || notification.amount) && (
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {notification.actionLabel && (
                                <Link href={notification.actionUrl || "#"}>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 px-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-[10px] font-black rounded-full transition-all active:scale-95 flex items-center gap-1.5 uppercase tracking-widest"
                                    >
                                        {notification.actionLabel}
                                        <ChevronRight className="w-2.5 h-2.5 opacity-50 transition-transform group-hover/btn:translate-x-0.5" />
                                    </Button>
                                </Link>
                            )}

                            {notification.amount && (
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-black/20 border border-white/5 rounded-full">
                                    <span className="text-[9px] text-white/20 font-black uppercase tracking-widest">Prize</span>
                                    <div className="w-px h-2.5 bg-white/10" />
                                    <span className="text-[var(--color-piggy-deep-pink)] font-mono text-[10px] font-black">
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
