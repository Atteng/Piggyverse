"use client";

import { useState } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Stream } from "@/lib/api/streams";

import { useQuery } from "@tanstack/react-query";

interface StreamPlayerProps {
    stream: Stream | null;
}

export function StreamPlayer({ stream }: StreamPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState([75]);

    // Poll for live stats
    const { data: stats } = useQuery<any>({
        queryKey: ['stream-stats', stream?.id],
        queryFn: async () => {
            if (!stream?.id) return null;
            const res = await fetch(`/api/streams/${stream.id}/stats`);
            return res.json();
        },
        enabled: !!stream?.id && stream.isLive,
        refetchInterval: 15000, // Poll every 15s
        initialData: stream ? { viewerCount: stream.viewerCount, status: stream.status } : null
    });

    const viewerCount = stats?.viewerCount ?? stream?.viewerCount ?? 0;
    const isLive = stats ? stats.status === "LIVE" : (stream?.isLive ?? false);

    if (!stream || !isLive) {
        return (
            <div className="rounded-2xl overflow-hidden bg-black/60 backdrop-blur-3xl border border-white/10 h-full flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                    <VolumeX className="w-8 h-8 text-gray-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Stream Offline</h3>
                <p className="text-gray-400">Tune in later for the next tournament!</p>
            </div>
        );
    }

    return (
        <div className="relative rounded-2xl overflow-hidden bg-black/60 backdrop-blur-3xl border border-white/10 group h-full flex flex-col">
            {/* Video Player Area - Flexible height */}
            <div className="relative w-full flex-1 min-h-0">
                {/* Placeholder Video/Stream */}
                <img
                    src={stream.thumbnailUrl || "/images/bg-2.jpg"} // Fallback image
                    alt="Stream"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />

                {/* Live Badge */}
                <div className="absolute top-3 left-3 z-20">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-600 rounded-full">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                        <span className="text-white font-bold text-[10px] uppercase tracking-wide">LIVE</span>
                    </div>
                </div>

                {/* Viewer Count */}
                <div className="absolute top-3 right-3 z-20">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10">
                        <Eye className="w-3 h-3 text-white" />
                        <span className="text-white font-bold text-xs">{viewerCount.toLocaleString()}</span>
                    </div>
                </div>

                {/* Picture-in-Picture Streamer Cam */}
                <div className="absolute bottom-16 right-3 z-20 w-36 h-24 rounded-lg overflow-hidden border-2 border-white/20 shadow-2xl">
                    <img
                        src="/bg-2.jpg"
                        alt="Streamer"
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Video Controls Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30">
                    <div className="space-y-2">
                        {/* Progress Bar */}
                        <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                            <div className="h-full bg-[var(--color-piggy-deep-pink)] w-1/3" />
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsPlaying(!isPlaying)}
                                    className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white"
                                >
                                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                </Button>

                                <div className="flex items-center gap-1.5">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setIsMuted(!isMuted)}
                                        className="h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 text-white"
                                    >
                                        {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                                    </Button>
                                    <div className="w-20">
                                        <Slider
                                            value={volume}
                                            onValueChange={setVolume}
                                            max={100}
                                            step={1}
                                            className="cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>

                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 text-white"
                            >
                                <Maximize className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stream Info - Always visible */}
            <div className="p-4 space-y-2 flex-shrink-0 bg-black/60 backdrop-blur-3xl">
                <h1 className="text-xl font-black text-[var(--color-piggy-deep-pink)] font-mono tracking-tight">
                    {stream.title}
                </h1>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-xs">{stream.channelName[0].toUpperCase()}</span>
                    </div>
                    <div className="min-w-0">
                        <p className="text-white font-bold font-mono text-sm">{stream.channelName}</p>
                        <p className="text-gray-400 text-xs font-mono">{viewerCount.toLocaleString()} watching now</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

