"use client";

import { StreamPlayer } from "@/features/stream/stream-player";
import { StreamChat } from "@/features/stream/stream-chat";
import { WatchToEarnTracker } from "@/features/stream/watch-to-earn-tracker";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getActiveStream } from "@/lib/api/streams";

export default function StreamPage() {
    const { data: stream, isLoading } = useQuery({
        queryKey: ['stream', 'active'],
        queryFn: getActiveStream,
    });

    if (isLoading) {
        return (
            <div className="w-full h-[calc(100vh-120px)] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--color-piggy-deep-pink)]" />
            </div>
        );
    }

    return (
        <div className="w-full max-w-[1920px] mx-auto p-4">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4" style={{ height: 'calc(100vh - 120px)' }}>
                {/* Left Column: Video Player with Watch-to-Earn Overlay */}
                <div className="relative h-full overflow-hidden">
                    <StreamPlayer stream={stream || null} />

                    {/* Stream Navigation Arrows */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/60 hover:bg-black/80 border border-white/10 text-white z-30"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/60 hover:bg-black/80 border border-white/10 text-white z-30"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </Button>

                    {/* Watch-to-Earn Tracker - Bottom Right */}
                    {stream?.id && (
                        <div className="absolute bottom-3 right-3 w-[320px]">
                            <WatchToEarnTracker streamId={stream.id} />
                        </div>
                    )}
                </div>

                {/* Right Column: Chat */}
                <div className="h-full">
                    <StreamChat streamId={stream?.id} />
                </div>
            </div>
        </div>
    );
}
