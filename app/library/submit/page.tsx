"use client";

import { SubmitGameForm } from "@/features/library/submit-game-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SubmitGamePage() {
    return (
        <div className="w-full max-w-2xl mx-auto px-6 py-8 space-y-8">
            <Link href="/library">
                <Button variant="ghost" className="text-white hover:text-gray-300 pl-0 mb-2">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Library
                </Button>
            </Link>

            <div>
                <h1 className="text-4xl font-black text-white font-mono tracking-tighter mb-2">
                    List Your App
                </h1>
                <p className="text-gray-400 font-mono">
                    Submit your game to the PiggyVerse library.
                </p>
            </div>

            <SubmitGameForm />
        </div>
    );
}
