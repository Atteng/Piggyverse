
export interface Stream {
    id: string;
    title: string;
    viewerCount: number;
    platform: 'twitch' | 'youtube';
    channelName: string; // e.g., 'piggydao'
    isLive: boolean;
    status?: string;
    thumbnailUrl?: string;
    startedAt?: string;
}

export interface WatchSession {
    id: string;
    startedAt: string;
    pointsEarned: number;
}

export async function getActiveStream(): Promise<Stream | null> {
    try {
        const res = await fetch('/api/streams/active', {
            cache: 'no-store', // Always get fresh stream data
        });

        if (!res.ok) {
            console.error('Failed to fetch active stream:', res.statusText);
            return null;
        }

        const data = await res.json();
        return data;
    } catch (error) {
        console.error('Error fetching active stream:', error);
        return null;
    }
}

export async function startWatchSession(streamId: string): Promise<WatchSession> {
    // TODO: Replace with real backend call to /api/streams/watch/start
    return {
        id: `session_${Date.now()}`,
        startedAt: new Date().toISOString(),
        pointsEarned: 0
    };
}

export async function trackWatchTime(sessionId: string): Promise<{ success: boolean; pointsEarned: number }> {
    // TODO: Replace with real backend call to /api/streams/watch/track
    return {
        success: true,
        pointsEarned: 1,
    };
}
