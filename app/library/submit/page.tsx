"use client";

import { SubmitGameForm } from "@/features/library/submit-game-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SubmitGamePage() {
    return (
        <div className="w-full max-w-7xl mx-auto px-2.5 md:px-6 py-6 md:py-8 space-y-6 md:space-y-8">
            <Link href="/library">
                <Button variant="ghost" className="text-white hover:bg-white/5 pl-0 mb-2 font-mono text-xs uppercase tracking-widest transition-all">
                    <ArrowLeft className="mr-2 h-3.5 w-3.5" strokeWidth={3} />
                    Back to Library
                </Button>
            </Link>

            <div>
                <h1 className="text-3xl md:text-4xl font-black text-white font-mono tracking-tighter mb-2">
                    List Your App
                </h1>
                <p className="text-white/70 font-mono text-xs md:text-sm max-w-md">
                    Submit your game to the PiggyVerse library. Join our curated collection and reach thousands of players.
                </p>
            </div>

            <SubmitGameForm />
        </div>
    );
}
