"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Play, ChevronLeft, ChevronRight, Loader2, ArrowRight } from "lucide-react";
import { getGames } from "@/lib/api/games";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";

export function HeroBanner() {
    const [currentIndex, setCurrentIndex] = useState(0);

    const { data, isLoading } = useQuery({
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

    // Loading State
    if (isLoading) {
        return (
            <div className="relative w-full overflow-hidden rounded-2xl md:rounded-[3rem] min-h-[280px] lg:min-h-[320px] bg-black/60 backdrop-blur-3xl border border-white/5 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-[var(--color-piggy-deep-pink)] opacity-20" />
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-48 h-8 bg-white/5 rounded-lg animate-pulse" />
                        <div className="w-32 h-4 bg-white/5 rounded-lg animate-pulse" />
                    </div>
                </div>
            </div>
        );
    }

    // Fallback if no games exist yet
    if (!featuredGame) {
        return (
            <div className="relative w-full overflow-hidden rounded-2xl md:rounded-[3rem] min-h-[280px] lg:min-h-[320px] group flex flex-col justify-center px-8 md:px-20 py-7 md:py-12 bg-black/60 backdrop-blur-3xl border border-white/5">
                <div className="relative z-10 flex flex-col items-start max-w-2xl">
                    <div className="inline-block px-3 py-1 mb-1.5 md:mb-4 text-[10px] font-bold tracking-widest text-[#FF2F7A] bg-white rounded-full shadow-lg uppercase">
                        Welcome to PiggyVerse
                    </div>
                    <h1 className="text-3xl md:text-4xl lg:text-6xl font-black text-white leading-[0.9] mb-4 font-mono tracking-tighter drop-shadow-2xl uppercase">
                        Play.<br />Compete.<br />Earn.
                    </h1>
                    <Link href="/library">
                        <Button className="bg-[var(--color-piggy-deep-pink)] hover:bg-[var(--color-piggy-deep-pink)]/90 text-white rounded-xl px-8 h-12 text-sm font-bold shadow-lg transition-all hover:scale-105">
                            Browse Games
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                </div>
                {/* Subtle Background Pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-piggy-deep-pink)]/5 to-transparent opacity-50" />
            </div>
        );
    }

    return (
        <div className="relative w-full overflow-hidden rounded-2xl md:rounded-[3rem] min-h-[280px] lg:min-h-[320px] group flex flex-col justify-center bg-black/60 backdrop-blur-3xl border border-white/5 shadow-2xl py-7 md:py-12">
            <AnimatePresence mode="wait">
                <motion.div
                    key={featuredGame.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    className="absolute inset-0 z-0"
                >
                    {/* Game Thumbnail Background - Darkened */}
                    <div className="absolute inset-0 z-0 overflow-hidden">
                        <img
                            src={featuredGame.thumbnail}
                            alt={featuredGame.title}
                            className="w-full h-full object-cover object-center transform scale-105 group-hover:scale-100 transition-transform duration-1000 opacity-20 mix-blend-luminosity"
                        />
                        <div className="absolute inset-0 bg-black/70" />
                    </div>

                    {/* Content */}
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="relative z-20 flex flex-col items-start max-w-2xl h-full justify-center px-8 md:px-20 lg:px-24"
                    >
                        <div className="flex items-center gap-3 mb-1.5 md:mb-2">
                            <div className="inline-block px-3 py-1 text-xs font-bold tracking-widest text-[#FF2F7A] bg-white rounded-full shadow-lg">
                                Featured Game
                            </div>
                            <Link href={`/competitive-hub/${featuredGame.id}`}>
                                <Button className="w-8 h-8 rounded-full bg-[var(--color-piggy-deep-pink)] hover:bg-[var(--color-piggy-deep-pink)] text-white shadow-xl flex items-center justify-center p-0 border-none transition-all hover:scale-110 active:scale-95">
                                    <Play className="h-4 w-4 fill-current ml-0.5" />
                                </Button>
                            </Link>
                        </div>

                        <h1 className="text-3xl md:text-4xl lg:text-6xl font-black text-white leading-[0.9] mb-1.5 md:mb-2 font-mono tracking-tighter drop-shadow-2xl max-w-xl uppercase">
                            {featuredGame.title}
                        </h1>

                        <p className="text-xs md:text-sm text-white/50 max-w-md mb-3 md:mb-5 font-medium leading-tight md:leading-relaxed">
                            {featuredGame.description || "Experience the next generation of competitive gaming in the PiggyVerse."}
                        </p>

                        <div className="flex items-center gap-6">
                            <div className="flex flex-col gap-0.5 items-start">
                                <span className="text-white/20 text-[7px] font-bold tracking-[0.2em]">Available on</span>
                                {featuredGame.platforms && featuredGame.platforms.length > 0 ? (
                                    <div className="flex gap-3">
                                        {featuredGame.platforms.map((platform) => (
                                            <span key={platform} className="text-white/80 font-bold text-xs tracking-widest capitalize">
                                                {platform}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex gap-3">
                                        <span className="text-white/80 font-bold text-xs tracking-widest">
                                            Web
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
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
                                className={`h-1 rounded-full transition-all duration-500 ${index === currentIndex
                                    ? "bg-[var(--color-piggy-deep-pink)] w-8"
                                    : "bg-white/10 hover:bg-white/20 w-4"
                                    }`}
                                aria-label={`Go to game ${index + 1}`}
                            />
                        ))}
                    </div>

                    {/* Arrows */}
                    <div className="absolute bottom-6 right-8 z-30 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={prevGame}
                            className="w-10 h-10 rounded-full border border-white/5 bg-black/60 backdrop-blur-3xl hover:bg-white text-white hover:text-black transition-all"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={nextGame}
                            className="w-10 h-10 rounded-full border border-white/5 bg-black/60 backdrop-blur-3xl hover:bg-white text-white hover:text-black transition-all"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
}
