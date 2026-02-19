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
            <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-20 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--color-piggy-deep-pink)]" />
            </div>
        );
    }

    if (status === "unauthenticated") {
        return (
            <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-20 text-center">
                <h2 className="text-piggy-title font-black text-white font-mono tracking-tighter mb-2">Please Sign In</h2>
                <p className="text-white font-mono text-piggy-label md:text-piggy-body opacity-70">You need to be logged in to view your notifications.</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8 space-y-6 md:space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-piggy-hero font-black text-white font-mono tracking-tighter mb-2">
                        Notifications
                    </h1>
                    <p className="text-white font-mono text-piggy-label md:text-piggy-body max-w-md opacity-70">
                        Stay updated on your earnings, tournaments, and rank progress.
                    </p>
                </div>
                <Button
                    onClick={() => markAllAsReadMutation.mutate()}
                    disabled={markAllAsReadMutation.isPending}
                    variant="ghost"
                    className="bg-black/60 backdrop-blur-md border border-white/10 rounded-full h-10 px-6 text-white text-piggy-label font-black flex items-center gap-2 shadow-lg hover:bg-black/80 transition-all active:scale-95 w-full sm:w-auto justify-center"
                >
                    {markAllAsReadMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <CheckCheck className="w-4 h-4 text-[var(--color-piggy-deep-pink)]" />
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
