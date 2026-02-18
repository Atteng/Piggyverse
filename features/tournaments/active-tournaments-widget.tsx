"use client";

import { useState, useEffect } from "react";
import { getTournaments } from "@/lib/api/tournaments";
import { useQuery } from "@tanstack/react-query";
import { Users, Trophy, ChevronRight, ChevronLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";

export function ActiveTournamentsWidget() {
    const router = useRouter();
    const { status } = useSession();
    const [currentIndex, setCurrentIndex] = useState(0);

    const { data, isLoading } = useQuery({
        queryKey: ['tournaments', 'active'],
        queryFn: () => getTournaments('PENDING,ACTIVE'),
    });

    const tournaments = data?.tournaments || [];

    // Reset index if list changes
    useEffect(() => {
        setCurrentIndex(0);
    }, [tournaments.length]);

    const handleNext = () => {
        if (tournaments.length === 0) return;
        setCurrentIndex((prev) => (prev + 1) % tournaments.length);
    };

    const handlePrev = () => {
        if (tournaments.length === 0) return;
        setCurrentIndex((prev) => (prev - 1 + tournaments.length) % tournaments.length);
    };

    const currentTournament = tournaments[currentIndex];

    if (isLoading) {
        return (
            <div className="bg-black/60 backdrop-blur-3xl border border-white/5 rounded-2xl md:rounded-[2.5rem] p-4 md:p-6 h-full flex flex-col items-center justify-center min-h-[300px]">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--color-piggy-deep-pink)] mb-2" />
                <p className="text-white/40 font-mono text-xs uppercase tracking-widest">Loading tournaments...</p>
            </div>
        );
    }

    // Empty State
    if (!currentTournament) {
        return (
            <div className="bg-black/60 backdrop-blur-3xl border border-white/5 rounded-2xl md:rounded-[2.5rem] p-4 md:p-6 h-full flex flex-col">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white font-mono uppercase tracking-tighter">Tournaments Active</h3>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                        <Trophy className="w-8 h-8 text-gray-500" />
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-white font-mono">No Active Tournaments</h4>
                        <p className="text-sm text-gray-400 mt-1 max-w-[200px] mx-auto">
                            Check back later or host your own tournament!
                        </p>
                    </div>
                    <Button
                        onClick={() => status === "authenticated" ? router.push('/competitive-hub/host') : signIn()}
                        className="bg-[var(--color-piggy-deep-pink)] text-white rounded-full mt-2"
                    >
                        {status === "authenticated" ? "Host Tournament" : "Login to Host"}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-black/60 backdrop-blur-3xl border border-white/5 rounded-2xl md:rounded-[2.5rem] p-4 md:p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white font-mono uppercase tracking-tighter">Tournaments Active</h3>
                <span className="text-[10px] font-black text-white/40 font-mono uppercase tracking-widest">
                    {currentIndex + 1} / {tournaments.length}
                </span>
            </div>

            <div className="flex-1 flex flex-col">
                <div className="relative rounded-3xl overflow-hidden group flex-1 min-h-[220px]">
                    {/* Background Image */}
                    <img
                        src={currentTournament.image}
                        alt={currentTournament.name}
                        className="absolute inset-0 w-full h-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                    {/* Betting Badge (If Betting Allowed) */}
                    {currentTournament.bettingAllowed && (
                        <div className="absolute top-4 left-4 z-10">
                            <span className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-sm font-bold text-gray-200 border border-white/10">
                                Betting Allowed
                            </span>
                        </div>
                    )}

                    {/* Status Badge */}
                    <div className="absolute top-4 right-4 z-10">
                        <span className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-sm font-bold text-gray-200 border border-white/10">
                            {currentTournament.status}
                        </span>
                    </div>

                    {/* Content Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-5 space-y-4">
                        <div>
                            <h4 className="text-xl font-black text-white font-mono leading-tight mb-1">
                                {currentTournament.name}
                            </h4>
                            <p className="text-sm font-bold text-gray-400">{currentTournament.game}</p>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-gray-300 font-mono text-base font-bold">
                                <Users className="w-4 h-4" />
                                <span>{currentTournament.registered.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[var(--color-piggy-deep-pink)] font-mono text-sm font-bold">
                                <Trophy className="w-4 h-4" />
                                <span>{currentTournament.prizePool}</span>
                            </div>
                        </div>

                        <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                            <div className="font-mono text-sm text-gray-400">
                                Entry: <span className="text-white font-bold ml-1">{currentTournament.entryFee}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation & Action */}
                <div className="flex items-center gap-3 mt-4">
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handlePrev}
                            disabled={tournaments.length <= 1}
                            className="h-10 w-10 rounded-full border-white/10 hover:bg-white/10 hover:text-white bg-black/20"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleNext}
                            disabled={tournaments.length <= 1}
                            className="h-10 w-10 rounded-full border-white/10 hover:bg-white/10 hover:text-white bg-black/20"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>

                    <Button
                        onClick={() => router.push(`/competitive-hub/${currentTournament.id}`)}
                        className="flex-1 bg-[var(--color-piggy-deep-pink)] hover:bg-[var(--color-piggy-deep-pink)]/90 text-white font-bold rounded-full h-10"
                    >
                        View More
                    </Button>
                </div>
            </div>
        </div>
    );
}
