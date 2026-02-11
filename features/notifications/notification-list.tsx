"use client";

import { useMemo } from "react";
import { NotificationItem } from "./notification-item";
import { Notification } from "@/lib/api/notifications";
import { ScrollArea } from "@/components/ui/scroll-area";
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
        <ScrollArea className="h-[calc(100vh-220px)] pr-4">
            <div className="space-y-8 pb-20">
                <AnimatePresence mode="popLayout">
                    {groupedNotifications.today.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-sm font-bold text-white mb-2 pl-1">
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
                        <div className="space-y-4">
                            <h2 className="text-sm font-bold text-white mb-2 pl-1">
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
                        <div className="space-y-4">
                            <h2 className="text-sm font-bold text-white mb-2 pl-1">
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
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                            <div className="w-8 h-8 text-gray-600">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                    stroke="currentColor"
                                    className="w-8 h-8"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                                    />
                                </svg>
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">No notifications found</h3>
                        <p className="text-sm text-gray-500">
                            We couldn&apos;t find any notifications for this filter.
                        </p>
                    </motion.div>
                )}
            </div>
        </ScrollArea>
    );
}
