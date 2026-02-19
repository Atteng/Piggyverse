"use client";

import { TournamentForm } from "@/features/tournaments/components/tournament-form";
import { useSession, signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Loader2, Lock } from "lucide-react";

export default function HostTournamentPage() {
    const { status } = useSession();

    if (status === "loading") {
        return (
            <div className="w-full max-w-7xl mx-auto min-h-[60vh] flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--color-piggy-deep-pink)] mb-4" />
                <p className="text-gray-400 font-mono">Checking permissions...</p>
            </div>
        );
    }

    if (status === "unauthenticated") {
        return (
            <div className="w-full max-w-7xl mx-auto min-h-[60vh] flex flex-col items-center justify-center text-center space-y-6 px-4">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                    <Lock className="w-10 h-10 text-gray-500" />
                </div>
                <h1 className="text-piggy-hero font-black text-white font-mono">Authentication Required</h1>
                <p className="text-gray-400 max-w-md mx-auto text-piggy-title">
                    You need to be logged in to host a tournament. Please sign in to continue.
                </p>
                <Button
                    onClick={() => signIn()}
                    className="bg-[var(--color-piggy-deep-pink)] hover:bg-[var(--color-piggy-deep-pink)]/90 text-white font-bold rounded-xl px-8 py-6 text-piggy-title"
                >
                    Sign In to Host
                </Button>
            </div>
        );
    }

    return (
        <div className="w-full max-w-7xl mx-auto px-2.5 md:px-6 py-6 md:py-8 space-y-6 md:space-y-8">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-piggy-hero font-black text-white font-mono tracking-tighter mb-2">
                    Host Tournament
                </h1>
                <p className="text-white/70 font-mono text-piggy-label md:text-piggy-body max-w-md">
                    Create your own competitive event. Choose your game, set the rules, and decide if you want to play for fun or for real rewards.
                </p>
            </div>

            <TournamentForm />
        </div>
    );
}
