"use client";

import { useMemo } from "react";
import { NotificationItem } from "./notification-item";
import { Notification } from "@/lib/api/notifications";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface NotificationListProps {
    notifications: Notification[];
    filter: string;
}

export function NotificationList({ notifications, filter }: NotificationListProps) {
    const filteredNotifications = useMemo(() => {
        if (filter === "all") return notifications;
        return notifications.filter((n) => n.type === filter);
    }, [notifications, filter]);

    // Group by date (Today, Yesterday, Earlier)
    const groupedNotifications = useMemo(() => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const groups = {
            today: [] as Notification[],
            yesterday: [] as Notification[],
            earlier: [] as Notification[],
        };

        filteredNotifications.forEach((notification) => {
            const date = new Date(notification.timestamp);
            if (date.toDateString() === today.toDateString()) {
                groups.today.push(notification);
            } else if (date.toDateString() === yesterday.toDateString()) {
                groups.yesterday.push(notification);
            } else {
                groups.earlier.push(notification);
            }
        });

        return groups;
    }, [filteredNotifications]);

    return (
        <ScrollArea className="h-[calc(100dvh-280px)] md:h-[calc(100vh-220px)] pr-0 md:pr-4 w-full">
            <div className="space-y-8 pb-20 w-full max-w-full overflow-hidden">
                <AnimatePresence mode="popLayout">
                    {groupedNotifications.today.length > 0 && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-black font-mono tracking-tighter uppercase leading-[0.8] text-white pl-1">
                                Today
                            </h2>
                            <div className="space-y-3">
                                {groupedNotifications.today.map((notification) => (
                                    <NotificationItem key={notification.id} notification={notification} />
                                ))}
                            </div>
                        </div>
                    )}

                    {groupedNotifications.yesterday.length > 0 && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-black font-mono tracking-tighter uppercase leading-[0.8] text-white pl-1">
                                Yesterday
                            </h2>
                            <div className="space-y-3">
                                {groupedNotifications.yesterday.map((notification) => (
                                    <NotificationItem key={notification.id} notification={notification} />
                                ))}
                            </div>
                        </div>
                    )}

                    {groupedNotifications.earlier.length > 0 && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-black font-mono tracking-tighter uppercase leading-[0.8] text-white pl-1">
                                Earlier
                            </h2>
                            <div className="space-y-3">
                                {groupedNotifications.earlier.map((notification) => (
                                    <NotificationItem key={notification.id} notification={notification} />
                                ))}
                            </div>
                        </div>
                    )}
                </AnimatePresence>

                {filteredNotifications.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-20 text-center"
                    >
                        <div className="w-16 h-16 rounded-3xl bg-black/60 border border-white/10 flex items-center justify-center mb-6 shadow-2xl backdrop-blur-3xl">
                            <Bell className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-black text-white font-mono tracking-tighter mb-2">No notifications found</h3>
                        <p className="text-sm text-white/40 font-mono">
                            We couldn&apos;t find any notifications for this filter.
                        </p>
                    </motion.div>
                )}
            </div>
        </ScrollArea>
    );
}
