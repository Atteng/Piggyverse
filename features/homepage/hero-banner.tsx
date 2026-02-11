"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { getGames } from "@/lib/api/games";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

export function HeroBanner() {
    const { data } = useQuery({
        queryKey: ['games', 'featured'],
        queryFn: () => getGames({ limit: 1 }),
    });

    const featuredGame = data?.games[0];

    // Fallback if no games exist yet
    if (!featuredGame) {
        return (
            <div className="relative w-full overflow-hidden rounded-3xl min-h-[400px] group flex flex-col justify-center px-8 py-12 bg-black/40 backdrop-blur-xl border border-white/10">
                {/* Background Pattern */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-piggy-deep-pink)]/30 to-black mix-blend-overlay opacity-50" />
                </div>

                <div className="relative z-10 flex flex-col items-start max-w-2xl">
                    <div className="inline-block px-3 py-1 mb-4 text-[10px] font-bold tracking-wider text-black bg-white rounded-full uppercase shadow-lg">
                        WELCOME TO PIGGYVERSE
                    </div>
                    <h1 className="text-5xl lg:text-7xl font-black text-white leading-none mb-8 font-sans tracking-tighter drop-shadow-lg">
                        PLAY.<br />COMPETE.<br />EARN.
                    </h1>
                    <Link href="/library">
                        <Button className="bg-[var(--color-piggy-deep-pink)] hover:bg-[var(--color-piggy-deep-pink)]/90 text-white rounded-xl px-10 py-7 text-xl font-bold shadow-[0_0_20px_rgba(255,47,122,0.5)] transition-all hover:scale-105 active:scale-95 group">
                            <Play className="mr-3 h-6 w-6 fill-current group-hover:animate-pulse" />
                            Browse Games
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full overflow-hidden rounded-3xl min-h-[400px] group flex flex-col justify-center px-8 py-12">
            {/* Background Pattern/Texture */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[url('/images/bg-2.jpg')] bg-cover bg-center mix-blend-overlay opacity-30" />
            </div>

            {/* Game Thumbnail Background - Blurred/Darkened */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 w-full h-full opacity-60 mix-blend-lighten">
                    <img
                        src={featuredGame.thumbnail}
                        alt={featuredGame.title}
                        className="w-full h-full object-cover object-center [mask-image:linear-gradient(to_bottom,transparent_0%,black_80%)]"
                    />
                </div>
            </div>

            {/* Content - Ensured on top */}
            <div className="relative z-10 flex flex-col items-start max-w-2xl">
                <div className="inline-block px-3 py-1 mb-4 text-[10px] font-bold tracking-wider text-black bg-white rounded-full uppercase shadow-lg">
                    FEATURED GAME
                </div>
                <h1 className="text-5xl lg:text-7xl font-black text-white leading-none mb-8 font-sans tracking-tighter drop-shadow-lg break-words max-w-full">
                    {featuredGame.title.toUpperCase()}
                </h1>

                <Button className="bg-[var(--color-piggy-deep-pink)] hover:bg-[var(--color-piggy-deep-pink)]/90 text-white rounded-xl px-10 py-7 text-xl font-bold shadow-[0_0_20px_rgba(255,47,122,0.5)] transition-all hover:scale-105 active:scale-95 group">
                    <Play className="mr-3 h-6 w-6 fill-current group-hover:animate-pulse" />
                    Play Now
                </Button>
            </div>
        </div>
    );
}
