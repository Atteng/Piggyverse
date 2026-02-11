"use client";

import { useState } from "react";
import { NotificationFilters } from "@/features/notifications/notification-filters";
import { NotificationList } from "@/features/notifications/notification-list";
import { Notification, getNotifications, markAllAsRead as markAllAsReadClient } from "@/lib/api/notifications";
import { Button } from "@/components/ui/button";
import { CheckCheck, Loader2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

export default function NotificationsPage() {
    const [filter, setFilter] = useState("all");
    const { status } = useSession();

    const { data: notifications = [], isLoading, refetch } = useQuery({
        queryKey: ['notifications', filter],
        queryFn: () => getNotifications({ type: filter !== "all" ? filter : undefined }),
        enabled: status === "authenticated",
    });

    const markAllAsReadMutation = useMutation({
        mutationFn: markAllAsReadClient,
        onSuccess: () => {
            refetch();
        }
    });

    if (status === "loading" || (status === "authenticated" && isLoading)) {
        return (
            <div className="container max-w-4xl mx-auto p-4 lg:p-8 flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--color-piggy-deep-pink)]" />
            </div>
        );
    }

    if (status === "unauthenticated") {
        return (
            <div className="container max-w-4xl mx-auto p-4 lg:p-8 text-center py-20">
                <h2 className="text-2xl font-bold text-white mb-2">Please Sign In</h2>
                <p className="text-gray-400">You need to be logged in to view your notifications.</p>
            </div>
        );
    }

    return (
        <div className="container max-w-4xl mx-auto p-4 lg:p-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">
                        Notifications
                    </h1>
                    <p className="text-white font-medium mt-1">
                        Stay updated on your earnings, tournaments, and rank.
                    </p>
                </div>
                <Button
                    onClick={() => markAllAsReadMutation.mutate()}
                    disabled={markAllAsReadMutation.isPending}
                    variant="outline"
                    className="bg-white/5 border-white/10 hover:bg-white/10 text-white gap-2"
                >
                    {markAllAsReadMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <CheckCheck className="w-4 h-4" />
                    )}
                    Mark all as read
                </Button>
            </div>

            {/* Filters */}
            <NotificationFilters filter={filter} onFilterChange={setFilter} />

            {/* List */}
            <NotificationList notifications={notifications} filter={filter} />
        </div>
    );
}
