"use client";

import { Monitor, Smartphone } from "lucide-react";
import Image from "next/image";

export function MobileBlocker() {
    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/95 backdrop-blur-sm p-6 text-center lg:hidden">
            <div className="relative w-24 h-24 mb-6 animate-pulse">
                <div className="absolute inset-0 bg-[var(--color-piggy-deep-pink)]/20 rounded-full blur-xl" />
                <Smartphone className="relative w-full h-full text-[var(--color-piggy-deep-pink)]" />
                <div className="absolute bottom-0 right-0 bg-red-500 rounded-full p-1 border-2 border-black">
                    <Monitor className="w-4 h-4 text-white" />
                </div>
            </div>

            <h1 className="text-3xl font-black text-white font-mono tracking-tighter mb-4">
                Desktop Only
            </h1>

            <p className="text-gray-400 max-w-sm mb-8 font-mono">
                PiggyVerse requires a larger screen for the best experience. Please switch to a PC or Tablet.
            </p>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4 max-w-xs w-full">
                <div className="text-xs text-[var(--color-piggy-deep-pink)] font-bold uppercase tracking-wider mb-1">
                    Mobile Release
                </div>
                <div className="text-lg font-mono text-white">
                    Coming Soon
                </div>
            </div>
        </div>
    );
}
