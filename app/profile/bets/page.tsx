"use client";

import { useQuery } from "@tanstack/react-query";
import { getUserBets } from "@/lib/api/betting";
import { Loader2, Trophy, AlertCircle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function MyBetsPage() {
    const { data: bets, isLoading } = useQuery({
        queryKey: ['my-bets'],
        queryFn: getUserBets
    });

    return (
        <div className="w-full max-w-4xl mx-auto px-6 py-12 space-y-8">
            <div className="flex items-center gap-4">
                <Link href="/profile">
                    <Button variant="ghost" className="text-gray-400 hover:text-white pl-0">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                </Link>
                <h1 className="text-piggy-title font-black text-white font-mono tracking-tighter">
                    My Betting History
                </h1>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-[var(--color-piggy-deep-pink)]" />
                </div>
            ) : !bets || bets.length === 0 ? (
                <div className="text-center py-20 bg-black/40 rounded-3xl border border-white/10">
                    <p className="text-gray-400 font-mono mb-4">No bets placed yet.</p>
                    <Link href="/competitive-hub">
                        <Button className="bg-[var(--color-piggy-deep-pink)] text-white hover:bg-[var(--color-piggy-deep-pink)]/80">
                            Explore Tournaments
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="grid gap-4">
                    {bets.map((bet: any) => (
                        <div key={bet.id} className="bg-black/40 border border-white/10 rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-white/20 transition-all">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-white font-bold text-piggy-body">
                                        {bet.market.question}
                                    </h3>
                                    <Badge variant="outline" className={`
                                        ${bet.status === 'WON' ? 'border-green-500 text-green-500' : ''}
                                        ${bet.status === 'LOST' ? 'border-red-500 text-red-500' : ''}
                                        ${bet.status === 'PENDING' ? 'border-yellow-500 text-yellow-500' : ''}
                                        ${bet.status === 'CONFIRMED' ? 'border-blue-500 text-blue-500' : ''}
                                    `}>
                                        {bet.status}
                                    </Badge>
                                </div>
                                <p className="text-piggy-body text-gray-400 font-mono">
                                    Tournament: {bet.market.tournament.title}
                                </p>
                                <p className="text-piggy-label text-gray-500 uppercase font-mono">
                                    Placed {formatDistanceToNow(new Date(bet.createdAt))} ago
                                </p>
                            </div>

                            <div className="flex items-center gap-8 bg-black/20 p-4 rounded-lg min-w-[200px] justify-between">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-mono">Wager</p>
                                    <p className="text-white font-bold text-piggy-title">{bet.amount} {bet.token}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-500 uppercase font-mono">Outcome</p>
                                    <p className="text-[var(--color-piggy-deep-pink)] font-bold">{bet.outcome.label}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
