export interface Notification {
    id: string;
    type: 'earning' | 'tournament' | 'system' | 'social';
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
    amount?: number;
    actionLabel?: string;
    actionUrl?: string;
}

export interface GetNotificationsOptions {
    type?: string;
    limit?: number;
}

export async function getNotifications(options?: GetNotificationsOptions): Promise<Notification[]> {
    const params = new URLSearchParams();
    if (options?.type) params.append("type", options.type);

    // In a real app we'd use the client helper:
    // const res = await api.get(`/notifications?${params.toString()}`);
    // return res.data.notifications;

    // For now, fetch directly from our Next.js API route
    const res = await fetch(`/api/notifications?${params.toString()}`);

    if (!res.ok) {
        if (res.status === 401) return []; // Return empty if unauthorized
        throw new Error("Failed to fetch notifications");
    }

    const data = await res.json();
    return data.notifications;
}

export async function markAsRead(id: string): Promise<boolean> {
    const res = await fetch(`/api/notifications`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isRead: true }),
    });

    return res.ok;
}

export async function markAllAsRead(): Promise<boolean> {
    // In a real implementation this would be a separate endpoint or a special ID
    const res = await fetch(`/api/notifications`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
    });

    return res.ok;
}
