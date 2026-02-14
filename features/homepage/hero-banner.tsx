"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Play, ChevronLeft, ChevronRight } from "lucide-react";
import { getGames } from "@/lib/api/games";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";

export function HeroBanner() {
    const [currentIndex, setCurrentIndex] = useState(0);

    const { data } = useQuery({
        queryKey: ['games', 'featured-list'],
        queryFn: () => getGames({ limit: 10 }),
    });

    const games = data?.games || [];
    const totalGames = games.length;

    const nextGame = useCallback(() => {
        if (totalGames > 0) {
            setCurrentIndex((prev) => (prev + 1) % totalGames);
        }
    }, [totalGames]);

    const prevGame = useCallback(() => {
        if (totalGames > 0) {
            setCurrentIndex((prev) => (prev - 1 + totalGames) % totalGames);
        }
    }, [totalGames]);

    useEffect(() => {
        if (totalGames <= 1) return;

        const interval = setInterval(nextGame, 10000); // 10 seconds
        return () => clearInterval(interval);
    }, [totalGames, nextGame]);

    const featuredGame = games[currentIndex];

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
        <div className="relative w-full overflow-hidden rounded-3xl min-h-[400px] lg:min-h-[450px] group flex flex-col justify-center px-8 py-12 bg-black/20 border border-white/5">
            <AnimatePresence mode="wait">
                <motion.div
                    key={featuredGame.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    className="absolute inset-0 z-0"
                >
                    {/* Background Pattern/Texture */}
                    <div className="absolute inset-0 z-0">
                        <div className="absolute inset-0 bg-[url('/images/bg-2.jpg')] bg-cover bg-center mix-blend-overlay opacity-20" />
                    </div>

                    {/* Game Thumbnail Background - Blurred/Darkened */}
                    <div className="absolute inset-0 z-0 pointer-events-none">
                        <div className="absolute inset-0 w-full h-full opacity-40 mix-blend-lighten">
                            <img
                                src={featuredGame.thumbnail}
                                alt={featuredGame.title}
                                className="w-full h-full object-cover object-center [mask-image:linear-gradient(to_bottom,transparent_0%,black_80%)]"
                            />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent z-10" />
                    </div>

                    {/* Content - Ensured on top */}
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="relative z-20 flex flex-col items-start max-w-2xl h-full justify-center px-8"
                    >
                        <div className="inline-block px-3 py-1 mb-4 text-[10px] font-bold tracking-wider text-black bg-white rounded-full uppercase shadow-lg">
                            FEATURED GAME
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-black text-white leading-none mb-8 font-sans tracking-tighter drop-shadow-lg break-words max-w-full">
                            {featuredGame.title.toUpperCase()}
                        </h1>

                        <Link href={`/competitive-hub/${featuredGame.id}`}>
                            <Button className="bg-[var(--color-piggy-deep-pink)] hover:bg-[var(--color-piggy-deep-pink)]/90 text-white rounded-xl px-10 py-7 text-xl font-bold shadow-[0_0_20px_rgba(255,47,122,0.5)] transition-all hover:scale-105 active:scale-95 group">
                                <Play className="mr-3 h-6 w-6 fill-current group-hover:animate-pulse" />
                                Play Now
                            </Button>
                        </Link>
                    </motion.div>
                </motion.div>
            </AnimatePresence>

            {/* Navigation Controls */}
            {totalGames > 1 && (
                <>
                    {/* Dots */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2">
                        {games.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                className={`w-2 h-2 rounded-full transition-all ${index === currentIndex
                                    ? "bg-[var(--color-piggy-deep-pink)] w-6"
                                    : "bg-white/20 hover:bg-white/40"
                                    }`}
                                aria-label={`Go to game ${index + 1}`}
                            />
                        ))}
                    </div>

                    {/* Arrows */}
                    <div className="absolute bottom-6 right-8 z-30 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={prevGame}
                            className="w-10 h-10 rounded-full border-white/10 bg-black/40 backdrop-blur-md hover:bg-white/10"
                        >
                            <ChevronLeft className="w-5 h-5 text-white" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={nextGame}
                            className="w-10 h-10 rounded-full border-white/10 bg-black/40 backdrop-blur-md hover:bg-white/10"
                        >
                            <ChevronRight className="w-5 h-5 text-white" />
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
}
