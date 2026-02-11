"use client";

import { motion } from "framer-motion";
import { GameCard } from "@/features/library/game-card";
import { getGames } from "@/lib/api/games";
import { useQuery, keepPreviousData } from "@tanstack/react-query";

import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

export default function LibraryPage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    // Get search query and current page from URL
    const query = searchParams.get('q') || "";
    const currentPage = Number(searchParams.get('page')) || 1;

    // Fetch games from API
    const { data, isLoading, isError } = useQuery({
        queryKey: ['games', currentPage, query],
        queryFn: () => getGames({ page: currentPage, search: query }),
        placeholderData: keepPreviousData,
    });

    const games = data?.games || [];
    const pagination = data?.pagination || { totalPages: 0, page: 1 };

    // Pagination handlers
    const goToPage = (page: number) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', page.toString());
        router.push(`/library?${params.toString()}`);
    };

    return (
        <div className="w-full max-w-6xl mx-auto px-6 md:px-0 py-8 space-y-8">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black text-white font-mono tracking-tighter mb-2">
                        Game Library
                    </h1>
                    <p className="text-white font-mono text-sm max-w-md">
                        Explore the PiggyVerse collection. Play, compete, and earn tokens in our curated list of games.
                    </p>
                </div>
            </div>

            {/* Results Info */}
            {query && (
                <div className="text-sm text-gray-400 font-mono">
                    Showing results for "{query}"
                </div>
            )}

            {/* Loading State relative to content area */}
            {isLoading ? (
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-[var(--color-piggy-deep-pink)]" />
                </div>
            ) : isError ? (
                <div className="text-center py-20 text-red-400 font-mono">
                    Failed to load games. Please try again later.
                </div>
            ) : (
                <>
                    {/* Games Grid */}
                    {games.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {games.map((game, index) => (
                                <motion.div
                                    key={game.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <GameCard game={game} />
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 text-gray-500 font-mono">
                            {query
                                ? `No games found matching "${query}"`
                                : "No games available yet. Check back soon!"}
                        </div>
                    )}

                    {/* Pagination Controls */}
                    {pagination.totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 mt-12">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => goToPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="rounded-full bg-black/40 border-white/10 hover:bg-white/10 hover:text-white disabled:opacity-30"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>

                            <span className="text-sm font-mono text-white">
                                Page {currentPage} of {pagination.totalPages}
                            </span>

                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => goToPage(Math.min(pagination.totalPages, currentPage + 1))}
                                disabled={currentPage === pagination.totalPages}
                                className="rounded-full bg-black/40 border-white/10 hover:bg-white/10 hover:text-white disabled:opacity-30"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
