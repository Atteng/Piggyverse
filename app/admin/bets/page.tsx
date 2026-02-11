"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

async function getAdminBets() {
    const res = await fetch('/api/admin/bets');
    if (!res.ok) throw new Error('Failed to fetch admin bets');
    return res.json();
}

import { Suspense } from "react";

function AdminBetsContent() {
    const { data: bets, isLoading } = useQuery({
        queryKey: ['admin-bets'],
        queryFn: getAdminBets
    });

    return (
        <div className="w-full max-w-7xl mx-auto px-6 py-12 space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/competitive-hub">
                        <Button variant="ghost" className="text-gray-400 hover:text-white pl-0">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Hub
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-black text-white font-mono tracking-tighter">
                        Admin: Active Bets
                    </h1>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-[var(--color-piggy-deep-pink)]" />
                </div>
            ) : (
                <div className="bg-black/40 border border-white/10 rounded-3xl overflow-hidden">
                    <table className="w-full text-left text-sm text-gray-400">
                        <thead className="bg-white/5 text-white uppercase font-mono text-xs">
                            <tr>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Tournament / Market</th>
                                <th className="px-6 py-4">Wager</th>
                                <th className="px-6 py-4">Outcome</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {bets?.map((bet: any) => (
                                <tr key={bet.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={bet.user.avatarUrl} />
                                                <AvatarFallback>{bet.user.username?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium text-white">{bet.user.username}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-white font-medium">{bet.market.tournament.title}</span>
                                            <span className="text-xs text-gray-500">{bet.market.question}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-mono font-bold text-white">
                                        {bet.amount} {bet.token}
                                    </td>
                                    <td className="px-6 py-4 text-[var(--color-piggy-deep-pink)]">
                                        {bet.outcome.label}
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant="outline" className={`
                                            ${bet.status === 'WON' ? 'border-green-500 text-green-500' : ''}
                                            ${bet.status === 'LOST' ? 'border-red-500 text-red-500' : ''}
                                            ${bet.status === 'PENDING' ? 'border-yellow-500 text-yellow-500' : ''}
                                            ${bet.status === 'CONFIRMED' ? 'border-blue-500 text-blue-500' : ''}
                                        `}>
                                            {bet.status}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs">
                                        {new Date(bet.createdAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default function AdminBetsPage() {
    return (
        <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-white" /></div>}>
            <AdminBetsContent />
        </Suspense>
    );
}
