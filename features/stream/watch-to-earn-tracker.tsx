"use client";

import { useState, useEffect } from "react";
import { Clock, TrendingUp, Zap, Award } from "lucide-react";
import { useSession } from "next-auth/react";

interface WatchToEarnTrackerProps {
    streamId?: string;
}

export function WatchToEarnTracker({ streamId }: WatchToEarnTrackerProps) {
    const { status } = useSession();
    const [watchTime, setWatchTime] = useState(0); // seconds
    const [pointsEarned, setPointsEarned] = useState(0);
    const [currentStreak, setCurrentStreak] = useState(1);
    const [sessionId, setSessionId] = useState<string | null>(null);

    // Start Session
    useEffect(() => {
        if (status === "authenticated" && streamId && !sessionId) {
            fetch('/api/watch-to-earn/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ streamId })
            })
                .then(res => res.json())
                .then(session => {
                    setSessionId(session.id);
                })
                .catch(err => console.error('Failed to start watch session:', err));
        }

        // Cleanup: End session on unmount
        return () => {
            if (sessionId) {
                fetch('/api/watch-to-earn/end', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionId })
                })
                    .then(res => res.json())
                    .then(data => {
                        console.log('Session ended:', data);
                    })
                    .catch(err => console.error('Failed to end session:', err));
            }
        };
    }, [status, streamId, sessionId]);

    // Heartbeat & Points Tracking
    useEffect(() => {
        if (!streamId) return;

        // Initial Ping
        const sendHeartbeat = async () => {
            try {
                const res = await fetch(`/api/streams/${streamId}/heartbeat`, { method: "POST" });
                const data = await res.json();
                if (data.pointsEarned) setPointsEarned(data.pointsEarned);

                // If we get viewer count back, we could expose it, but let StreamPlayer handle that via polling
            } catch (error) {
                console.error("Heartbeat failed", error);
            }
        };

        sendHeartbeat(); // Immediate ping on mount

        const interval = setInterval(() => {
            setWatchTime((prev) => prev + 1);
            if ((watchTime + 1) % 30 === 0) {
                sendHeartbeat();
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [streamId, watchTime]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="bg-black/90 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-black/40 px-3 py-1.5 border-b border-white/10">
                <div className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-[var(--color-piggy-deep-pink)]" />
                    <span className="text-white font-bold text-[10px] uppercase tracking-wider">Watch to Earn</span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="p-2.5 grid grid-cols-3 gap-2">
                {/* Watch Time */}
                <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                        <Clock className="w-3 h-3 text-white/60" />
                        <span className="text-[9px] text-white/60 uppercase tracking-wide">Time</span>
                    </div>
                    <span className="text-white font-bold text-base font-mono">{formatTime(watchTime)}</span>
                </div>

                {/* Points Earned */}
                <div className="text-center border-x border-white/10">
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                        <Award className="w-3 h-3 text-white/60" />
                        <span className="text-[9px] text-white/60 uppercase tracking-wide">Points</span>
                    </div>
                    <span className="text-[var(--color-piggy-deep-pink)] font-bold text-base font-mono">{pointsEarned}</span>
                </div>

                {/* Current Streak */}
                <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                        <TrendingUp className="w-3 h-3 text-white/60" />
                        <span className="text-[9px] text-white/60 uppercase tracking-wide">Streak</span>
                    </div>
                    <span className="text-white font-bold text-base font-mono">{currentStreak}x</span>
                </div>
            </div>
        </div>
    );
}

