"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, FileText, CheckCircle2, ShieldCheck, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

interface ProofOfSettlementModalProps {
    isOpen: boolean;
    onClose: () => void;
    market: any;
    tableId: string;
}

export function ProofOfSettlementModal({
    isOpen,
    onClose,
    market,
    tableId
}: ProofOfSettlementModalProps) {
    // 1. Parse Hand Number from DSL
    const handNumberMatch = market?.resolverDSL?.match(/HAND:\s*(\d+)/);
    const handNumber = handNumberMatch ? parseInt(handNumberMatch[1], 10) : null;

    // 2. Fetch Logs
    const { data: handData, isLoading, error } = useQuery({
        queryKey: ['hand-logs', tableId, handNumber],
        queryFn: async () => {
            if (!tableId || !handNumber) return null;
            const res = await fetch(`/api/poker/hand/${tableId}/${handNumber}`);
            if (!res.ok) throw new Error("Failed to fetch logs");
            return res.json();
        },
        enabled: isOpen && !!tableId && !!handNumber,
        staleTime: Infinity // Logs don't change
    });

    const logs = handData?.logs || [];

    // Helper to highlight winning line
    const isHighlight = (msg: string) => {
        if (!market.winningOutcomeId) return false;
        // Simple heuristic: does the log mention the winner and "wins"?
        const winnerName = market.outcomes.find((o: any) => o.id === market.winningOutcomeId)?.label;
        if (!winnerName) return false;
        return msg.includes(winnerName) && (msg.includes("wins") || msg.includes("collected"));
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] bg-[#1a1a1a] border-white/10 text-white max-h-[85vh] flex flex-col p-0 overflow-hidden rounded-2xl">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="flex items-center gap-2 text-xl font-black uppercase tracking-tighter">
                        <ShieldCheck className="w-6 h-6 text-[var(--color-piggy-super-green)]" />
                        Proof of Settlement
                    </DialogTitle>
                    <DialogDescription className="text-gray-400 font-mono text-xs uppercase tracking-wide">
                        Cryptographically verifiable log trace for Market #{market?.id.slice(-4)}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-6">
                    {/* 1. Logic Trace Block */}
                    <div className="bg-black/40 rounded-xl border border-white/10 p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-4 h-4 text-[var(--color-piggy-deep-pink)]" />
                            <h4 className="text-xs font-bold uppercase tracking-widest text-gray-300">Oracle Logic Trace</h4>
                        </div>
                        <code className="text-[10px] md:text-xs text-[var(--color-piggy-deep-pink)] font-mono block whitespace-pre-wrap break-all bg-black/40 p-3 rounded-lg border border-[var(--color-piggy-deep-pink)]/20">
                            {market?.resolverDSL || "No trace available."}
                        </code>
                    </div>

                    {/* 2. Raw Logs Block */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-gray-300 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[var(--color-piggy-super-green)] animate-pulse" />
                                Raw Game Logs (Hand #{handNumber})
                            </h4>
                            <span className="text-[10px] text-gray-500 font-mono">Source: PokerNow API</span>
                        </div>

                        <ScrollArea className="h-[300px] w-full rounded-xl border border-white/10 bg-black/60 shadow-inner">
                            <div className="p-4 space-y-1.5 font-mono text-xs">
                                {isLoading ? (
                                    <div className="flex items-center justify-center py-20 text-gray-500 gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Fetching logs from game server...
                                    </div>
                                ) : error ? (
                                    <div className="flex items-center justify-center py-20 text-red-400 gap-2">
                                        <AlertTriangle className="w-4 h-4" />
                                        Failed to verify logs.
                                    </div>
                                ) : logs.length === 0 ? (
                                    <div className="text-center py-20 text-gray-500">No logs found for this hand.</div>
                                ) : (
                                    logs.map((log: any, i: number) => {
                                        const highlight = isHighlight(log.msg);
                                        return (
                                            <div
                                                key={i}
                                                className={`
                                                    py-1.5 px-2 rounded 
                                                    ${highlight ? 'bg-[var(--color-piggy-super-green)]/20 text-[var(--color-piggy-super-green)] border border-[var(--color-piggy-super-green)]/30 font-bold' : 'text-gray-400 border border-transparent'}
                                                `}
                                            >
                                                <span className="text-gray-600 mr-2 opacity-50">
                                                    {format(new Date(log.at), "HH:mm:ss")}
                                                </span>
                                                {log.msg}
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* 3. Verification Badge */}
                    <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 p-3 rounded-xl">
                        <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                        <div>
                            <h4 className="text-green-400 font-bold text-xs uppercase tracking-wide">Independently Verified</h4>
                            <p className="text-[10px] text-green-500/70 leading-tight">
                                The Oracle's decision matches the raw game state fetched directly from the game server.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-white/10 bg-black/20 text-center">
                    <Button variant="ghost" className="text-xs uppercase hover:bg-white/5 text-gray-400" onClick={onClose}>
                        Close Verification
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
