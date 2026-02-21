"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Trophy, Users, Clock, Calendar, Coins, ArrowLeft, Share2, Info, TrendingUp, Loader2, Shield, CheckCircle2, Plus, Wifi, XCircle, Gavel, FileSignature, Sparkles, Check, RefreshCw, Download } from "lucide-react";
import { useBettingCart } from "@/context/betting-cart-context";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useCallback } from "react";
import {
    getTournamentDetails,
    registerForTournament,
    unregisterFromTournament,
    deleteTournament,
    createTournament,
    resolveMarket,
    syncTournamentResults,
    updateTournament,
    syncTournamentResultsFullCSV,
} from "@/lib/api/tournaments";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Settings, Trash2, Edit } from "lucide-react";
import { useTournamentLeaderboard } from "@/hooks/use-tournament-leaderboard";
import { useToast } from "@/hooks/use-toast";
import { PaymentDepositModal } from './payment-deposit-modal';
import { MarketResolutionModal } from "./market-resolution-modal";
import { TournamentEditModal } from "./tournament-edit-modal";
import { MarketEditModal } from "./market-edit-modal";
import { SeedDepositModal } from "./seed-deposit-modal";
import { MarketCreateModal } from "./market-create-modal";
import { ProofOfSettlementModal } from "@/features/betting/components/proof-of-settlement-modal";
import { BettingCartDrawer } from "@/features/betting/components/betting-cart-drawer";
import { BettingCartFloatingButton } from "@/features/betting/components/betting-cart-floating-button";
import { TreasuryPaymentModal } from "@/features/betting/components/treasury-payment-modal";
import { ShieldCheck } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface TournamentDetailsViewProps {
    tournamentId: string;
}

export function TournamentDetailsView({ tournamentId }: TournamentDetailsViewProps) {
    const router = useRouter();
    const { data: session, status } = useSession();
    const queryClient = useQueryClient();

    // Safely get toast with fallback
    let toast: any;
    try {
        const toastHook = useToast();
        toast = toastHook?.toast || (() => { });
    } catch (e) {
        console.error("useToast error:", e);
        toast = () => { };
    }

    // Modals State
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSeedModalOpen, setIsSeedModalOpen] = useState(false);

    // Fetch Tournament Details
    const { data: tournament, isLoading, error } = useQuery({
        queryKey: ['tournament', tournamentId],
        queryFn: () => getTournamentDetails(tournamentId),
        refetchInterval: 15000, // Refresh every 15 seconds to reduce server load
    });

    // Resolution Modal State
    const [resolutionMarket, setResolutionMarket] = useState<any>(null);
    const [isResolutionModalOpen, setIsResolutionModalOpen] = useState(false);

    // Edit Market Modal State
    const [marketToEdit, setMarketToEdit] = useState<any>(null);
    const [isMarketEditModalOpen, setIsMarketEditModalOpen] = useState(false);
    const [isMarketCreateModalOpen, setIsMarketCreateModalOpen] = useState(false);

    // Proof of Settlement Modal State
    const [proofMarket, setProofMarket] = useState<any>(null);
    const [isProofModalOpen, setIsProofModalOpen] = useState(false);

    // Betting Cart State
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isTreasuryModalOpen, setIsTreasuryModalOpen] = useState(false);

    // Tabs State
    const [activeTab, setActiveTab] = useState("overview");
    const [marketTab, setMarketTab] = useState("binary");

    // Countdown Logic
    const [timeLeft, setTimeLeft] = useState<string>("");
    const [isRegistrationExpired, setIsRegistrationExpired] = useState(false);

    // Download State
    const [isDownloading, setIsDownloading] = useState(false);

    const calculateTimeLeft = useCallback(() => {
        if (!tournament) {
            setTimeLeft("");
            setIsRegistrationExpired(false);
            return;
        }

        const deadline = tournament.registrationDeadline ? new Date(tournament.registrationDeadline) : new Date(tournament.startDate);
        const now = new Date();
        const diff = deadline.getTime() - now.getTime();

        if (diff <= 0) {
            setTimeLeft("Expired");
            setIsRegistrationExpired(true);
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const seconds = Math.floor((diff / 1000) % 60);

        if (days > 0) {
            setTimeLeft(`${days}d ${hours}h ${minutes}m`);
        } else if (hours > 0) {
            setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        } else {
            setTimeLeft(`${minutes}m ${seconds}s`);
        }
        setIsRegistrationExpired(false);
    }, [tournament]);

    useEffect(() => {
        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);
        return () => clearInterval(timer);
    }, [calculateTimeLeft]);

    // Auto-refresh tournament data when countdown hits zero to trigger Auto-Activate
    useEffect(() => {
        if (isRegistrationExpired && tournament?.status === 'PENDING') {
            queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] });
        }
    }, [isRegistrationExpired, tournament?.status, tournamentId, queryClient]);

    // ... (rest of hook calls) ... (Wait, I need to match original content)

    // Real-time Leaderboard Updates
    useTournamentLeaderboard(tournamentId);

    // Mutation: Register
    const registerMutation = useMutation({
        mutationFn: () => registerForTournament(tournamentId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] });
            toast({ title: "Success", description: "You have registered for the tournament!" });
        },
        onError: (error: Error) => {
            toast({ title: "Registration Failed", description: error.message, variant: "destructive" });
        }
    });

    // Mutation: Approve AI Result
    const approveMutation = useMutation({
        mutationFn: async (marketId: string) => {
            const res = await fetch(`/api/betting/markets/${marketId}/approve`, {
                method: 'POST',
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to approve');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] });
            toast({ title: "Market Settled", description: "AI result approved and bets paid out (ledger updated)." });
        },
        onError: (error: Error) => {
            toast({ title: "Approval Failed", description: error.message, variant: "destructive" });
        }
    });

    // Mutation: Reject AI Result
    const rejectMutation = useMutation({
        mutationFn: async (marketId: string) => {
            const res = await fetch(`/api/betting/markets/${marketId}/reject`, {
                method: 'POST',
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to reject');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] });
            toast({ title: "Proposal Rejected", description: "Market is open for manual resolution or continued betting." });
        },
        onError: (error: Error) => {
            toast({ title: "Rejection Failed", description: error.message, variant: "destructive" });
        }
    });

    // Mutation: Unregister
    const unregisterMutation = useMutation({
        mutationFn: () => unregisterFromTournament(tournamentId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] });
            toast({ title: "Success", description: "You have left the tournament." });
        },
        onError: (error: Error) => {
            toast({ title: "Failed to Unregister", description: error.message, variant: "destructive" });
        }
    });

    // Mutation: Cancel Tournament (Emergency Override)
    const cancelTournamentMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/tournaments/${tournamentId}/cancel`, {
                method: 'POST'
            });
            if (!res.ok) throw new Error(await res.text());
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId] });
            toast({ title: "Success", description: "Tournament cancelled successfully" });
        },
        onError: (err: any) => {
            toast({ title: "Cancellation Failed", description: err.message, variant: "destructive" });
        }
    });

    const handleCancelTournament = () => {
        if (window.confirm("ARE YOU SURE? This will permanently cancel this tournament and its betting markets!")) {
            cancelTournamentMutation.mutate();
        }
    };

    // Mutation: Sync Results (Incremental JSON)
    const syncMutation = useMutation({
        mutationFn: () => syncTournamentResults(tournamentId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] });
            toast({
                title: "Results Synced",
                description: "Tournament winner and betting markets have been updated.",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Sync Failed",
                description: error.message,
                variant: "destructive"
            });
        }
    });

    // Mutation: Sync Results (Full CSV Override)
    const syncFullCSVMutation = useMutation({
        mutationFn: () => syncTournamentResultsFullCSV(tournamentId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] });
            toast({
                title: "Full CSV Sync Complete",
                description: "Final standings, bust-outs, and payouts verified via log override.",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "CSV Sync Failed",
                description: error.message,
                variant: "destructive"
            });
        }
    });

    // Mutation: Resume Market (Anti-Sniping Override)
    const resumeMarketMutation = useMutation({
        mutationFn: async (marketId: string) => {
            const res = await fetch(`/api/betting/markets/${marketId}/resume`, {
                method: 'POST',
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to resume');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] });
            toast({ title: "Market Resumed", description: "Betting is now open again." });
        },
        onError: (error: Error) => {
            toast({ title: "Resume Failed", description: error.message, variant: "destructive" });
        }
    });

    // Mutation: Delete Tournament
    const deleteMutation = useMutation({
        mutationFn: () => deleteTournament(tournamentId),
        onSuccess: () => {
            toast({ title: "Tournament Deleted", description: "The tournament has been cancelled." });
            router.push("/competitive-hub");
        },
        onError: (error: Error) => {
            toast({ title: "Delete Failed", description: error.message, variant: "destructive" });
        }
    });

    const handleDelete = () => {
        deleteMutation.mutate();
    };


    // Edit Modal State
    const handleEditClick = () => {
        setIsEditModalOpen(true);
    };

    // Live Odds Polling for Autonomous Markets
    // Refresh tournament data every 3s if there are active autonomous markets
    useEffect(() => {
        if (!tournament?.bettingMarkets) return;

        const hasLiveMarkets = tournament.bettingMarkets.some((m: any) =>
            m.status === 'OPEN' && m.isAutonomous
        );

        if (hasLiveMarkets) {
            const interval = setInterval(() => {
                queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] });
            }, 3000);
            return () => clearInterval(interval);
        }
    }, [tournament, tournamentId, queryClient]);

    const handleCopy = () => {
        deleteMutation.mutate();
    };

    const { isInSlip, addToSlip, removeFromSlip } = useBettingCart();

    const handleBetClick = (market: any, outcome: any) => {
        if (market.status !== "OPEN") return;
        if (status !== "authenticated") {
            signIn();
            return;
        }

        if (isInSlip(outcome.id)) {
            removeFromSlip(outcome.id);
        } else {
            addToSlip({
                marketId: market.id,
                outcomeId: outcome.id,
                marketQuestion: market.marketQuestion,
                outcomeLabel: outcome.label,
                odds: outcome.currentOdds || outcome.weight || 1.0,
                tournamentId: tournament.id,
                tournamentName: tournament.name,
                amount: 0, // Default amount
                token: tournament.prizePoolToken || 'USDC'
            });
        }
    };

    const handleResolveClick = (market: any) => {
        setResolutionMarket(market);
        setIsResolutionModalOpen(true);
    };

    // Payment Modal State


    const handleRegisterClick = () => {
        if (status !== "authenticated") {
            signIn();
            return;
        }

        // If paid tournament, open payment modal
        if (tournament?.entryFeeAmount && tournament.entryFeeAmount > 0) {
            setIsPaymentModalOpen(true);
        } else {
            // Free tournament
            registerMutation.mutate();
        }
    };

    const handleDownloadSettlements = async () => {
        setIsDownloading(true);
        try {
            const response = await fetch(`/api/tournaments/${tournamentId}/settlements`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to generate settlements");
            }

            const data = await response.json();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `tournament-${tournamentId}-settlements.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast({ title: "Success", description: "Settlement report downloaded successfully!" });
        } catch (error) {
            toast({
                title: "Download Failed",
                description: error instanceof Error ? error.message : "An error occurred",
                variant: "destructive"
            });
        } finally {
            setIsDownloading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="w-full h-96 flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-[var(--color-piggy-deep-pink)]" />
            </div>
        );
    }

    if (error || !tournament) {
        return <div className="text-white text-center py-20">Tournament not found</div>;
    }

    const userRegistration = tournament.registrations?.find((p: any) => p.user.id === session?.user?.id);
    const isPaid = !tournament.entryFeeAmount || tournament.entryFeeAmount === 0 || userRegistration?.paymentStatus === 'COMPLETED';
    const isRegistered = !!userRegistration && isPaid;
    const isPendingPayment = !!userRegistration && !isPaid;
    const isHost = !!session?.user?.id && session?.user?.id === tournament.host?.id;

    // Filter participants for display (only show paid/confirmed)
    const confirmedParticipants = tournament.registrations?.filter((p: any) =>
        !tournament.entryFeeAmount || tournament.entryFeeAmount === 0 || p.paymentStatus === 'COMPLETED'
    ) || [];

    const progress = ((confirmedParticipants.length || 0) / (tournament.maxPlayers || 2000)) * 100;

    return (
        <div className="w-full max-w-7xl mx-auto pb-20 space-y-1 md:space-y-8 animate-in fade-in duration-500">
            {/* Back Button */}
            <Button
                variant="ghost"
                onClick={() => router.back()}
                className="text-white hover:text-white pl-0 hover:bg-transparent"
            >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Hub
            </Button>

            {/* Header Section */}
            <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-[#1a1a1a] shadow-2xl">
                {/* Background Image with Overlay */}
                <div className="absolute inset-0 z-0">
                    <img src={tournament.imageUrl || tournament.game?.thumbnailUrl || "/bg-2.jpg"} alt={tournament.name} className="w-full h-full object-cover opacity-30" />
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-3xl" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                </div>

                <div className="relative z-10 p-4 md:p-12">
                    <div className="flex items-center justify-between w-full mb-6 relative">
                        <span className="text-sm font-black text-[var(--color-piggy-deep-pink)] uppercase tracking-tighter">
                            {tournament.game?.title || "Game"}
                        </span>
                        <div className="flex gap-2 ml-auto">
                            {isHost && (
                                <Badge className="bg-purple-600 text-white border-0 capitalize px-2 md:px-3 py-1 text-xs font-black uppercase tracking-tighter flex items-center gap-1">
                                    <Shield className="w-3 h-3 shrink-0" />
                                    <span className="hidden md:inline">Host Mode</span>
                                </Badge>
                            )}
                            <Badge className={cn(
                                "text-white border-0 capitalize px-2 md:px-3 py-1 text-xs font-black uppercase tracking-tighter flex items-center gap-1",
                                tournament.status === "ACTIVE" ? "bg-red-500 animate-pulse" :
                                    (tournament.status === "PENDING" && !isRegistrationExpired) ? "bg-green-500" : "bg-gray-500"
                            )}>
                                {tournament.status === "ACTIVE" ? (
                                    <><Wifi className="w-3 h-3 shrink-0" /><span className="hidden md:inline">Live</span></>
                                ) : tournament.status === "PENDING" && !isRegistrationExpired ? (
                                    <><CheckCircle2 className="w-3 h-3 shrink-0" /><span className="hidden md:inline">Registration Open</span></>
                                ) : tournament.status === "PENDING" && isRegistrationExpired ? (
                                    <><XCircle className="w-3 h-3 shrink-0" /><span className="hidden md:inline">Registration Closed</span></>
                                ) : (
                                    <><CheckCircle2 className="w-3 h-3 shrink-0" /><span className="hidden md:inline">{tournament.status}</span></>
                                )}
                            </Badge>
                        </div>

                        {isHost && (
                            <div className="ml-4">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="icon" className="border-white/10 bg-black/60 backdrop-blur-3xl hover:bg-white/10">
                                            <Settings className="w-4 h-4 text-white" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48 bg-[#1a1a1a] border-white/10 text-white">
                                        <DropdownMenuItem
                                            className="cursor-pointer hover:bg-white/10"
                                            onClick={handleEditClick}
                                        >
                                            <Edit className="w-4 h-4 mr-2" /> Edit Details
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="text-red-500 focus:text-red-500 focus:bg-red-500/10 cursor-pointer"
                                            onClick={() => setIsDeleteDialogOpen(true)}
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" /> Delete Tournament
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-end">
                        <div className="lg:col-span-2 space-y-4">
                            <h1 className="text-piggy-hero md:text-[3rem] font-black text-white font-mono tracking-tighter uppercase leading-none">
                                {tournament.name}
                            </h1>

                            <p className="text-gray-300 text-piggy-body max-w-2xl font-medium leading-snug">
                                {tournament.description}
                            </p>

                            {/* Lobby Access Display */}
                            {(isRegistered || isHost) && (
                                <div className="bg-black/60 backdrop-blur-3xl border border-white/10 rounded-2xl p-4 mt-6 w-full max-w-xl animate-in fade-in slide-in-from-top-4 duration-500">
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-start gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-[var(--color-piggy-deep-pink)]/20 flex items-center justify-center shrink-0">
                                                <Shield className="w-4 h-4 text-[var(--color-piggy-deep-pink)]" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                                    <h3 className="text-white text-piggy-body font-black uppercase tracking-tighter">
                                                        Tournament Access
                                                    </h3>
                                                    {(tournament.inviteCodes?.[0]?.code || isHost) ? (
                                                        <Badge className="bg-[var(--color-piggy-super-green)] text-black text-[10px] h-4 font-bold uppercase tracking-tight py-0">
                                                            {isRegistered ? "Code Ready" : isHost ? "Host View" : "Code Pending"}
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-yellow-500 border-yellow-500/50 text-[10px] h-4 uppercase tracking-tight py-0">Code Pending</Badge>
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-gray-400 font-medium leading-tight">
                                                    {isHost
                                                        ? "Review the access links you've provided for participants."
                                                        : "Use these details to join the game lobby or Discord."}
                                                </p>
                                            </div>
                                        </div>

                                        {(tournament.lobbyUrl || tournament.discordLink) && (
                                            <div className="flex items-center gap-2 w-full">
                                                {tournament.lobbyUrl && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => window.open(tournament.lobbyUrl, '_blank')}
                                                        className="flex-1 bg-[var(--color-piggy-deep-pink)] hover:bg-[var(--color-piggy-deep-pink)]/80 text-white font-black uppercase tracking-tighter text-[10px] h-8 px-3 rounded-lg"
                                                    >
                                                        Join Lobby
                                                    </Button>
                                                )}
                                                {tournament.discordLink && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => window.open(tournament.discordLink, '_blank')}
                                                        className="flex-1 border-white/10 bg-black/60 backdrop-blur-3xl hover:bg-white/10 text-white font-black uppercase tracking-tighter text-[10px] h-8 px-3 rounded-lg"
                                                    >
                                                        Discord
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {tournament.inviteCodes?.[0]?.code && !isHost ? (
                                        <div className="mt-3 bg-black/60 rounded-xl p-2.5 flex items-center justify-between border border-white/5 group hover:border-[var(--color-piggy-deep-pink)]/30 transition-colors">
                                            <div className="flex flex-col ml-1">
                                                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Your Lobby Code</span>
                                                <code className="text-xl font-black text-white font-mono tracking-[0.1em]">
                                                    {tournament.inviteCodes[0].code}
                                                </code>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-gray-400 hover:text-white hover:bg-white/5 h-8 px-3 text-[10px] font-bold uppercase"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(tournament.inviteCodes![0].code);
                                                    toast({ title: "Copied", description: "Lobby code copied to clipboard" });
                                                }}
                                            >
                                                Copy
                                            </Button>
                                        </div>
                                    ) : isHost && (tournament.inviteCodes?.length || 0) > 0 ? (
                                        <div className="mt-3 bg-black/60 rounded-xl p-3 border border-white/10">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Code Assignment Status</span>
                                                <span className="text-[10px] text-[var(--color-piggy-deep-pink)] font-bold">
                                                    {tournament.inviteCodes.filter((c: any) => c.isUsed).length} / {tournament.inviteCodes.length} Assigned
                                                </span>
                                            </div>
                                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-[var(--color-piggy-deep-pink)] transition-all duration-500"
                                                    style={{ width: `${(tournament.inviteCodes.filter((c: any) => c.isUsed).length / tournament.inviteCodes.length) * 100}%` }}
                                                />
                                            </div>
                                            <p className="text-[10px] text-gray-500 mt-2 text-center">
                                                Remaining codes will be automatically assigned to new participants.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="mt-3 bg-black/60 rounded-xl p-3 border border-dashed border-white/10 text-center">
                                            <p className="text-[11px] text-gray-400 font-medium mb-1">
                                                {isHost
                                                    ? "No invite codes have been uploaded for this tournament."
                                                    : "Lobby code pending assignment by host."}
                                            </p>
                                            <p className="text-[10px] text-[var(--color-piggy-deep-pink)] font-bold italic">
                                                {isHost
                                                    ? "You can add codes by editing your tournament."
                                                    : "Check back in a moment or stay tuned on Discord."}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex flex-wrap gap-x-4 gap-y-2 pt-2 md:pt-4 text-sm font-mono text-gray-400">
                                <div className="flex items-center gap-1.5 font-bold uppercase tracking-tight">
                                    <Info className="w-4 h-4 text-[var(--color-piggy-deep-pink)]" />
                                    {tournament.host?.username || "Unknown Host"}
                                </div>
                                <div className="flex items-center gap-1.5 font-bold uppercase tracking-tight">
                                    <Calendar className="w-4 h-4 text-[var(--color-piggy-deep-pink)]" />
                                    {tournament.startDate && format(new Date(tournament.startDate), "PPP")}
                                </div>
                                <div className="flex items-center gap-1.5 font-bold uppercase tracking-tight">
                                    <Clock className="w-4 h-4 text-[var(--color-piggy-deep-pink)]" />
                                    {tournament.startTime ? (
                                        // Attempt to parse HH:mm
                                        (() => {
                                            try {
                                                const [hours, minutes] = tournament.startTime.split(':');
                                                const date = new Date();
                                                date.setHours(parseInt(hours), parseInt(minutes));
                                                return format(date, "p");
                                            } catch (e) {
                                                return tournament.startTime;
                                            }
                                        })()
                                    ) : (
                                        tournament.startDate && format(new Date(tournament.startDate), "p")
                                    )}
                                </div>
                                {tournament.isIncentivized && (
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-1.5 text-white font-medium uppercase tracking-tighter bg-[var(--color-piggy-deep-pink)]/10 px-3 py-1 rounded-full border border-[var(--color-piggy-deep-pink)]/20 w-fit whitespace-nowrap">
                                            <Coins className="w-4 h-4 text-[var(--color-piggy-deep-pink)]" />
                                            Prize Pool: {tournament.prizePoolAmount} {tournament.prizePoolToken || tournament.entryFeeToken || "PIGGY"}
                                        </div>
                                        {isHost && (tournament as any).prizePoolSeed !== undefined && (
                                            <span className="text-[9px] text-gray-500 font-bold uppercase ml-2">
                                                {(tournament as any).prizePoolSeed} Seed + {(tournament.prizePoolAmount || 0) - ((tournament as any).prizePoolSeed || 0)} Revenue
                                            </span>
                                        )}
                                    </div>
                                )}
                                {!isRegistrationExpired && tournament.status === 'PENDING' && (
                                    <div className="flex items-center gap-1.5 text-white font-medium uppercase tracking-tighter bg-[#ff4d94]/10 px-3 py-1 rounded-full border border-[#ff4d94]/20 animate-pulse whitespace-nowrap">
                                        <Clock className="w-4 h-4 text-[#ff4d94]" />
                                        Registration Ends In: {timeLeft}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col gap-4 w-full">
                            <div className="bg-black/60 backdrop-blur-3xl p-4 rounded-2xl border border-white/10 space-y-2">
                                <div className="flex justify-between text-piggy-body mb-1">
                                    <span className="text-gray-400 flex items-center gap-2 font-bold uppercase tracking-tight"><Users className="w-4 h-4" /> Participants</span>
                                    <span className="text-white font-black tracking-tighter">{confirmedParticipants.length} / {tournament.maxPlayers}</span>
                                </div>
                                <Progress value={progress} className="h-2 bg-white/10" indicatorClassName="bg-[var(--color-piggy-super-green)]" />
                            </div>

                            <div className="flex flex-col gap-2">
                                <div className="flex gap-3">
                                    {isHost && tournament.status === 'COMPLETED' ? (
                                        <Button
                                            onClick={handleDownloadSettlements}
                                            disabled={isDownloading}
                                            className="flex-1 bg-[var(--color-piggy-deep-pink)] hover:bg-[var(--color-piggy-deep-pink)]/80 text-white font-black uppercase tracking-tighter h-12 rounded-xl shadow-[0_0_20px_rgba(255,47,122,0.4)]"
                                        >
                                            {isDownloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                                            {isDownloading ? "Generating..." : "Download Settlements"}
                                        </Button>
                                    ) : isRegistered ? (
                                        <Button
                                            onClick={() => unregisterMutation.mutate()}
                                            disabled={unregisterMutation.isPending || tournament.status === 'ACTIVE' || tournament.status === 'COMPLETED'}
                                            variant="destructive"
                                            className="flex-1 font-black uppercase tracking-tighter h-12 rounded-xl disabled:opacity-50"
                                        >
                                            {unregisterMutation.isPending ? "Leaving..." : "Unregister"}
                                        </Button>
                                    ) : isPendingPayment ? (
                                        <Button
                                            onClick={() => setIsPaymentModalOpen(true)}
                                            disabled={isRegistrationExpired || tournament.status === 'COMPLETED'}
                                            className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-black uppercase tracking-tighter h-12 rounded-xl shadow-[0_0_20px_rgba(234,179,8,0.4)] disabled:opacity-50"
                                        >
                                            {isRegistrationExpired || tournament.status === 'COMPLETED' ? "Registration Closed" : "Complete Payment"}
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={handleRegisterClick}
                                            disabled={registerMutation.isPending || (confirmedParticipants.length >= tournament.maxPlayers) || (isRegistrationExpired && tournament.status === 'PENDING') || tournament.status === 'COMPLETED'}
                                            className="flex-1 bg-[var(--color-piggy-deep-pink)] hover:bg-[var(--color-piggy-deep-pink)]/80 text-white font-black uppercase tracking-tighter h-12 rounded-xl shadow-[0_0_20px_rgba(255,47,122,0.4)] disabled:opacity-50 disabled:grayscale"
                                        >
                                            {registerMutation.isPending ? "Registering..." :
                                                tournament.status === 'COMPLETED' ? "Tournament Ended" :
                                                    (isRegistrationExpired && tournament.status === 'PENDING') ? "Registration Closed" :
                                                        tournament.status === "ACTIVE" ? "Watch Stream" : "Register Now"}
                                        </Button>
                                    )}

                                    <Button
                                        variant="outline"
                                        className="h-12 w-12 shrink-0 rounded-xl border-white/10 bg-black/60 backdrop-blur-3xl hover:bg-white/10"
                                        onClick={() => {
                                            const url = window.location.href;
                                            navigator.clipboard.writeText(url);
                                            toast({
                                                title: "Link Copied!",
                                                description: "Tournament link has been copied to your clipboard.",
                                            });
                                        }}
                                    >
                                        <Share2 className="w-5 h-5 text-white" />
                                    </Button>
                                </div>

                                {isHost && (
                                    <div className="flex gap-2 w-full">
                                        <Button
                                            onClick={() => setIsSeedModalOpen(true)}
                                            className="flex-none px-4 bg-zinc-700 hover:bg-zinc-600 text-white font-black uppercase tracking-tighter h-10 rounded-xl border border-white/10 text-[10px] md:text-xs"
                                        >
                                            Seed Pool
                                        </Button>
                                        <Button
                                            onClick={() => syncFullCSVMutation.mutate()}
                                            disabled={syncFullCSVMutation.isPending || (tournament.status !== 'ACTIVE' && tournament.status !== 'COMPLETED')}
                                            className="flex-1 bg-[var(--color-piggy-super-green)] hover:bg-[var(--color-piggy-super-green)]/80 text-black font-black uppercase tracking-tighter h-10 rounded-xl border border-[var(--color-piggy-super-green)]/50 text-[10px] md:text-xs shadow-[0_0_15px_rgba(189,255,0,0.4)] overflow-hidden text-ellipsis whitespace-nowrap"
                                        >
                                            {syncFullCSVMutation.isPending ? <RefreshCw className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 animate-spin shrink-0" /> : <Download className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 shrink-0" />}
                                            Full Sync (Completed)
                                        </Button>

                                        {/* Cancel Tournament Button (Only for Hosts of PENDING/ACTIVE games) */}
                                        {isHost && (tournament?.status === 'PENDING' || tournament?.status === 'ACTIVE') && (
                                            <Button
                                                onClick={handleCancelTournament}
                                                disabled={cancelTournamentMutation.isPending}
                                                variant="outline"
                                                className="flex-none px-4 bg-red-900/20 border-red-500/30 hover:bg-red-900/40 text-red-500 font-black h-10 rounded-xl text-[10px] md:text-xs"
                                            >
                                                {cancelTournamentMutation.isPending ? <RefreshCw className="w-3 h-3 animate-spin mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                                                Cancel
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Tabs */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-4 md:p-12 pt-0 md:pt-0">
                    <div className="lg:col-span-3">


                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            {/* Mobile: Dropdown Selector */}
                            <div className="md:hidden w-full mb-4 relative z-20">
                                <Select value={activeTab} onValueChange={setActiveTab}>
                                    <SelectTrigger className="w-full bg-black/80 backdrop-blur-xl border-white/10 text-white h-12 rounded-full shadow-2xl font-bold uppercase tracking-widest text-xs focus:ring-0 focus:ring-offset-0 ring-offset-0 focus:ring-transparent">
                                        <SelectValue placeholder="Select View" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-black/90 backdrop-blur-3xl border-white/10 text-white rounded-2xl shadow-2xl z-50">
                                        {["Overview", "Rules", "Prizes", "Participants"].map(tab => (
                                            <SelectItem
                                                key={tab}
                                                value={tab.toLowerCase()}
                                                className="focus:bg-white/10 focus:text-white cursor-pointer py-3 font-mono text-xs uppercase tracking-tight text-white hover:text-white hover:bg-white/5"
                                            >
                                                {tab}
                                            </SelectItem>
                                        ))}
                                        {tournament.allowBetting && (
                                            <SelectItem
                                                value="betting"
                                                className="focus:bg-white/10 focus:text-white cursor-pointer py-3 font-mono text-xs uppercase tracking-tight text-white hover:text-white hover:bg-white/5"
                                            >
                                                Betting
                                            </SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Desktop: Tabs List */}
                            <TabsList className="hidden md:flex bg-black/60 backdrop-blur-3xl border border-white/10 w-full justify-start p-1 h-auto rounded-xl">
                                {["Overview", "Rules", "Prizes", "Participants"].map(tab => (
                                    <TabsTrigger
                                        key={tab}
                                        value={tab.toLowerCase()}
                                        className="data-[state=active]:bg-[var(--color-piggy-deep-pink)] data-[state=active]:text-white text-gray-400 py-3 px-6 rounded-lg font-bold font-mono text-piggy-body uppercase"
                                    >
                                        {tab}
                                    </TabsTrigger>
                                ))}
                                {tournament.allowBetting && (
                                    <TabsTrigger
                                        value="betting"
                                        className="data-[state=active]:bg-[var(--color-piggy-deep-pink)] data-[state=active]:text-white text-gray-400 py-3 px-6 rounded-lg font-bold font-mono text-piggy-body uppercase"
                                    >
                                        Betting
                                    </TabsTrigger>
                                )}
                            </TabsList>

                            <TabsContent value="overview" className="mt-2 md:mt-6 space-y-3 md:space-y-6">
                                <div className="bg-black/60 backdrop-blur-3xl border border-white/10 rounded-2xl p-4 md:p-6">
                                    <h3 className="text-piggy-label font-mono font-black uppercase tracking-widest text-[var(--color-piggy-deep-pink)] mb-3">About this Tournament</h3>
                                    <p className="text-gray-400 text-piggy-body leading-snug">
                                        {tournament.description}
                                    </p>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                                        <div className="bg-white/5 p-4 rounded-xl text-center">
                                            <div className="text-xs text-gray-500 uppercase mb-1">Entry Fee</div>
                                            <div className="text-lg font-bold text-white">
                                                {tournament.entryFeeAmount ? `${tournament.entryFeeAmount} ${tournament.entryFeeToken}` : "Free"}
                                            </div>
                                        </div>
                                        <div className="bg-white/5 p-4 rounded-xl text-center">
                                            <div className="text-xs text-gray-500 uppercase mb-1">Format</div>
                                            <div className="text-lg font-bold text-white">Single Elim</div>
                                        </div>
                                        <div className="bg-white/5 p-4 rounded-xl text-center">
                                            <div className="text-xs text-gray-500 uppercase mb-1">Platform</div>
                                            <div className="text-lg font-bold text-white">PC / Mobile</div>
                                        </div>
                                        <div className="bg-white/5 p-4 rounded-xl text-center">
                                            <div className="text-xs text-gray-500 uppercase mb-1">Server</div>
                                            <div className="text-lg font-bold text-white">Global</div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="rules" className="mt-2 md:mt-6">
                                <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl p-4 md:p-6">
                                    <h3 className="text-xs font-mono font-black uppercase tracking-widest text-[var(--color-piggy-deep-pink)] mb-3">Official Rules</h3>
                                    {(tournament.rules && Array.isArray(tournament.rules)) ? (
                                        <ul className="space-y-3">
                                            {tournament.rules.map((rule: string, i: number) => (
                                                <li key={i} className="flex items-start gap-3 text-gray-400 text-sm leading-snug">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-piggy-deep-pink)] mt-2" />
                                                    {rule}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-gray-400 text-sm leading-snug whitespace-pre-wrap">{tournament.rules || "No specific rules listed."}</p>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="prizes" className="mt-2 md:mt-6">
                                <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl p-4 md:p-6">
                                    <h3 className="text-xs font-mono font-black uppercase tracking-widest text-[var(--color-piggy-deep-pink)] mb-3">Prize Pool Distribution</h3>
                                    <div className="space-y-3">
                                        {tournament.prizeDistribution ? (
                                            <p className="text-gray-400 text-sm leading-snug whitespace-pre-wrap font-mono">
                                                {typeof tournament.prizeDistribution === 'string'
                                                    ? tournament.prizeDistribution
                                                    : JSON.stringify(tournament.prizeDistribution, null, 2)}
                                            </p>
                                        ) : (
                                            <div className="text-gray-400 text-sm leading-snug">Prize distribution details coming soon.</div>
                                        )}
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="participants" className="mt-2 md:mt-6">
                                <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl p-4 md:p-6">
                                    <h3 className="text-xs font-mono font-black uppercase tracking-widest text-[var(--color-piggy-deep-pink)] mb-3">Participants ({confirmedParticipants.length})</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {[...confirmedParticipants]
                                            .sort((a: any, b: any) => {
                                                if (a.finalRank && b.finalRank) return a.finalRank - b.finalRank;
                                                if (a.finalRank) return -1;
                                                if (b.finalRank) return 1;
                                                return (a.user.username || "").localeCompare(b.user.username || "");
                                            })
                                            .map((p: any) => {
                                                const assignedCode = isHost ? tournament.inviteCodes?.find((c: any) => c.usedByUserId === p.user.id)?.code : null;

                                                // Elimination Tracker Styling
                                                const hasRank = typeof p.finalRank === 'number';
                                                let rankColor = "text-gray-400 border-white/5 bg-black/40";
                                                let cardStyle = "bg-white/5 border-white/5 hover:border-white/10";

                                                if (hasRank) {
                                                    if (p.finalRank === 1) {
                                                        rankColor = "text-[#FFD700] border-[#FFD700]/30 bg-[#FFD700]/10";
                                                        cardStyle = "bg-[#FFD700]/10 border-[#FFD700]/30 hover:bg-[#FFD700]/15 hover:scale-[1.02]";
                                                    } else if (p.finalRank === 2) {
                                                        rankColor = "text-[#C0C0C0] border-[#C0C0C0]/30 bg-[#C0C0C0]/10";
                                                        cardStyle = "bg-[#C0C0C0]/10 border-[#C0C0C0]/30 hover:bg-[#C0C0C0]/15 hover:scale-[1.02]";
                                                    } else if (p.finalRank === 3) {
                                                        rankColor = "text-[#CD7F32] border-[#CD7F32]/30 bg-[#CD7F32]/10";
                                                        cardStyle = "bg-[#CD7F32]/10 border-[#CD7F32]/30 hover:bg-[#CD7F32]/15 hover:scale-[1.02]";
                                                    } else if (p.finalRank <= 10) {
                                                        rankColor = "text-[var(--color-piggy-cyan)] border-[var(--color-piggy-cyan)]/20 bg-black/40";
                                                        cardStyle = "bg-[var(--color-piggy-cyan)]/5 border-[var(--color-piggy-cyan)]/20 hover:border-[var(--color-piggy-cyan)]/40 hover:bg-[var(--color-piggy-cyan)]/10";
                                                    } else {
                                                        rankColor = "text-zinc-500 border-zinc-500/20 bg-black/40 opacity-70";
                                                        cardStyle = "bg-white/5 border-white/5 opacity-70";
                                                    }
                                                }

                                                return (
                                                    <div key={p.id} className={cn(
                                                        "flex items-center justify-between p-3 rounded-lg border transition-all duration-300",
                                                        cardStyle
                                                    )}>
                                                        <div className="flex items-center gap-3">
                                                            <div className={cn(
                                                                "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border transition-colors",
                                                                rankColor
                                                            )}>
                                                                {hasRank ? `#${p.finalRank}` : (p.user.username?.[0] || "U")}
                                                            </div>
                                                            <span className={cn(
                                                                "font-bold text-sm",
                                                                hasRank && p.finalRank === 1 ? "text-[#FFD700]" : hasRank && p.finalRank <= 10 ? "text-white" : "text-gray-400"
                                                            )}>
                                                                {p.user.username || "Anonymous"}
                                                            </span>
                                                        </div>
                                                        {isHost && assignedCode && (
                                                            <div className="flex items-center gap-2">
                                                                <code className="text-[10px] font-mono bg-black/40 text-[var(--color-piggy-super-green)] px-2 py-1 rounded border border-[var(--color-piggy-super-green)]/20">
                                                                    {assignedCode}
                                                                </code>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        {confirmedParticipants.length === 0 && <div className="text-gray-400 text-sm leading-snug">No participants yet.</div>}
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="betting" className="mt-2 md:mt-6 flex-none block">
                                <div className="flex flex-col gap-[10px]">
                                    {/* Host Actions Toolbar */}
                                    {isHost && (
                                        <div className="bg-[var(--color-piggy-deep-pink)]/10 border border-[var(--color-piggy-deep-pink)]/30 rounded-2xl p-4 relative z-40 block mb-6">
                                            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                                <div className="flex items-center gap-3">
                                                    <Shield className="w-5 h-5 text-[var(--color-piggy-deep-pink)]" />
                                                    <span className="font-mono font-bold text-white uppercase tracking-tight text-sm">Host Controls</span>
                                                </div>
                                                <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                                                    {/* Create Market Button */}
                                                    <Button
                                                        onClick={() => setIsMarketCreateModalOpen(true)}
                                                        className="w-full md:w-auto bg-[var(--color-piggy-deep-pink)] hover:bg-[var(--color-piggy-deep-pink)]/90 text-white font-mono uppercase tracking-widest text-xs h-10 px-6 rounded-xl shadow-[0_0_15px_rgba(255,47,122,0.3)] transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                        Add Market
                                                    </Button>

                                                    {/* Sync Results Button */}
                                                    <Button
                                                        onClick={() => syncMutation.mutate()}
                                                        disabled={syncMutation.isPending || tournament.status === 'PENDING'}
                                                        className={cn(
                                                            "w-full md:w-auto bg-[var(--color-piggy-deep-pink)] hover:bg-[var(--color-piggy-deep-pink)]/90 text-white font-mono uppercase tracking-widest text-xs h-10 px-6 rounded-xl shadow-[0_0_15px_rgba(255,47,122,0.3)] transition-all flex items-center justify-center gap-2",
                                                            tournament.status === 'PENDING' && "opacity-50 cursor-not-allowed bg-slate-700 shadow-none hover:bg-slate-700"
                                                        )}
                                                    >
                                                        {syncMutation.isPending ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Wifi className="w-4 h-4" />
                                                        )}
                                                        {syncMutation.isPending ? "Syncing..." : tournament.status === 'PENDING' ? "Auto-Sync (Must be Live)" : "Auto-Sync (Oracle)"}
                                                    </Button>

                                                    {/* Resolve Markets Button */}
                                                    {(tournament.bettingMarkets?.filter((m: any) => m.status !== 'SETTLED').length || 0) > 0 && (
                                                        (tournament.bettingMarkets?.filter((m: any) => m.status !== 'SETTLED').length === 1) ? (
                                                            <Button
                                                                onClick={() => {
                                                                    const activeMarket = tournament.bettingMarkets.find((m: any) => m.status !== 'SETTLED');
                                                                    if (activeMarket) {
                                                                        setResolutionMarket(activeMarket);
                                                                        setIsResolutionModalOpen(true);
                                                                    }
                                                                }}
                                                                className="w-full md:w-auto bg-zinc-700 hover:bg-zinc-600 text-white font-mono uppercase tracking-widest text-xs h-10 px-6 rounded-xl shadow-[0_0_15px_rgba(63,63,70,0.3)] transition-all flex items-center justify-center gap-2"
                                                            >
                                                                <Gavel className="w-4 h-4" />
                                                                Manual Sync
                                                            </Button>
                                                        ) : (
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button
                                                                        className="w-full md:w-auto bg-zinc-700 hover:bg-zinc-600 text-white font-mono uppercase tracking-widest text-xs h-10 px-6 rounded-xl shadow-[0_0_15px_rgba(63,63,70,0.3)] transition-all flex items-center justify-center gap-2"
                                                                    >
                                                                        <Gavel className="w-4 h-4" />
                                                                        Manual Sync
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-white/10 text-white w-56">
                                                                    {tournament.bettingMarkets?.filter((m: any) => m.status !== 'SETTLED').map((market: any) => (
                                                                        <DropdownMenuItem
                                                                            key={market.id}
                                                                            onClick={() => {
                                                                                setResolutionMarket(market);
                                                                                setIsResolutionModalOpen(true);
                                                                            }}
                                                                            className="hover:bg-white/10 focus:bg-white/10 cursor-pointer font-mono text-xs uppercase tracking-tight py-2"
                                                                        >
                                                                            {market.marketQuestion || market.question}
                                                                        </DropdownMenuItem>
                                                                    ))}
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Market Type Tabs */}
                                    <div className="w-full">
                                        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
                                            <div className="bg-black/60 backdrop-blur-3xl border border-white/10 p-1 rounded-2xl h-auto flex gap-1 overflow-x-auto w-full md:w-auto simple-scrollbar">
                                                {[
                                                    { id: "binary", label: "Binary Events", shortLabel: "Binary", type: "BINARY" },
                                                    { id: "parimutuel", label: "Parimutuel Events", shortLabel: "Parimutuel", type: "PARIMUTUEL" },
                                                    { id: "weighted", label: "Weighted Events", shortLabel: "Weighted", type: "SCALAR" },
                                                    { id: "scored", label: "Scored Events", shortLabel: "Scored", type: "QSCORE" }
                                                ].map((tab) => (
                                                    <button
                                                        key={tab.id}
                                                        onClick={() => setMarketTab(tab.id)}
                                                        className={cn(
                                                            "flex-1 flex items-center justify-center gap-1 py-2.5 px-1.5 rounded-xl text-piggy-tiny font-bold transition-all whitespace-nowrap",
                                                            marketTab === tab.id ? "bg-[var(--color-piggy-deep-pink)] text-white shadow-lg" : "text-gray-400 hover:text-white"
                                                        )}
                                                    >
                                                        <span className="md:hidden">{tab.shortLabel}</span>
                                                        <span className="hidden md:inline">{tab.label}</span>
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-gray-400 border-white/10 text-[10px] uppercase tracking-wider hidden md:flex">
                                                    <Info className="w-3 h-3 mr-1" />
                                                    {tournament.bettingMarkets?.length || 0} Markets Active
                                                </Badge>
                                            </div>
                                        </div>

                                        {[
                                            { id: "binary", label: "Binary Events", shortLabel: "Binary", type: "BINARY" },
                                            { id: "parimutuel", label: "Parimutuel Events", shortLabel: "Parimutuel", type: "PARIMUTUEL" },
                                            { id: "weighted", label: "Weighted Events", shortLabel: "Weighted", type: "SCALAR" },
                                            { id: "scored", label: "Scored Events", shortLabel: "Scored", type: "QSCORE" }
                                        ].map((tab) => {
                                            const filteredMarkets = tournament.bettingMarkets?.filter((m: any) => m.marketType === tab.type) || [];
                                            if (tab.id !== marketTab) return null;

                                            return (
                                                <div key={tab.id} className="mt-0 space-y-4 w-full">
                                                    {filteredMarkets.length > 0 ? (
                                                        filteredMarkets.map((market: any) => (
                                                            <div key={market.id} className="bg-black/60 backdrop-blur-3xl border border-white/10 rounded-3xl p-4 md:p-6 relative overflow-hidden mb-8 last:mb-0">
                                                                {/* Market Header with Line Separator */}
                                                                <div className="flex items-center gap-4 mb-6 w-full">
                                                                    <div className="shrink-0 flex flex-col gap-1 max-w-[75%]">
                                                                        <h3 className="text-piggy-label md:text-piggy-body font-normal text-gray-400 font-mono">
                                                                            {market.marketType === "BINARY" ? "BINARY MATCH" :
                                                                                market.marketType === "PARIMUTUEL" ? "PARIMUTUEL POOL" :
                                                                                    market.marketType === "SCALAR" ? "WEIGHTED POOL" :
                                                                                        market.marketType === "QSCORE" ? "SCORE PREDICTION" : "BETTING EVENT"}
                                                                        </h3>
                                                                        <h2 className="text-piggy-body md:text-piggy-title font-medium text-white leading-tight break-words">
                                                                            {market.marketQuestion}
                                                                        </h2>
                                                                    </div>
                                                                    <div className="flex-1 h-[1px] bg-white/10" />

                                                                    {/* Market Status Badges */}
                                                                    <div className="flex items-center gap-2 shrink-0">
                                                                        {market.isAutonomous && (
                                                                            <div className="w-2 h-2 rounded-full bg-[var(--color-piggy-cyan)] animate-pulse shadow-[0_0_8px_var(--color-piggy-cyan)]" title="Live Odds" />
                                                                        )}
                                                                        {isHost && (
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                onClick={() => {
                                                                                    setMarketToEdit(market);
                                                                                    setIsMarketEditModalOpen(true);
                                                                                }}
                                                                                className="h-8 w-8 text-gray-500 hover:text-white hover:bg-white/10 rounded-full"
                                                                            >
                                                                                <Edit className="w-4 h-4" />
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Outcome Grid - The New Design */}
                                                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                                                                    {market.outcomes?.map((outcome: any) => {
                                                                        const isSelected = isInSlip(outcome.id);
                                                                        const isWinner = market.status === "SETTLED" && market.winningOutcomeId === outcome.id;

                                                                        return (
                                                                            <button
                                                                                key={outcome.id}
                                                                                onClick={() => handleBetClick(market, outcome)}
                                                                                disabled={market.status !== "OPEN"}
                                                                                className={cn(
                                                                                    "group relative flex items-center justify-between w-full p-1 pl-4 pr-1 rounded-xl border transition-all duration-300",
                                                                                    "bg-black/40 backdrop-blur-md", // Base background
                                                                                    isSelected
                                                                                        ? "border-[var(--color-piggy-deep-pink)] shadow-[0_0_20px_rgba(255,47,122,0.2)] bg-[var(--color-piggy-deep-pink)]/5"
                                                                                        : "border-white/10 hover:border-white/30 hover:bg-white/5",
                                                                                    market.status !== "OPEN" && "opacity-50 cursor-not-allowed grayscale"
                                                                                )}
                                                                            >
                                                                                {/* Label */}
                                                                                <span className={cn(
                                                                                    "font-medium text-sm truncate mr-2 transition-colors",
                                                                                    isSelected ? "text-white" : "text-gray-400 group-hover:text-gray-200"
                                                                                )}>
                                                                                    {outcome.label}
                                                                                </span>

                                                                                {/* Odds Box */}
                                                                                <div className={cn(
                                                                                    "px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all",
                                                                                    isSelected
                                                                                        ? "bg-[var(--color-piggy-deep-pink)] text-white shadow-sm"
                                                                                        : "bg-white/10 text-gray-300 group-hover:bg-white/20 group-hover:text-white"
                                                                                )}>
                                                                                    {(outcome.currentOdds || outcome.weight || 1.0).toFixed(2)}x
                                                                                </div>
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>

                                                                {/* Host Logic Trace / Proposal Section */}
                                                                {isHost && market.resolutionStatus === 'PROPOSED' && (
                                                                    <div className="mt-8 pt-6 border-t border-white/5">
                                                                        <div className="bg-gradient-to-r from-[var(--color-piggy-deep-pink)]/20 to-purple-500/20 border border-[var(--color-piggy-deep-pink)]/50 rounded-xl p-4 animate-in fade-in slide-in-from-top-2">
                                                                            <div className="flex items-center gap-3 mb-3">
                                                                                <Badge className="bg-[var(--color-piggy-deep-pink)] text-white font-mono uppercase text-[10px]">Oracle Proposal</Badge>
                                                                                <span className="text-xs text-gray-400 font-mono">
                                                                                    Winner: <span className="text-white font-bold">{market.outcomes.find((o: any) => o.id === market.aiProposedWinnerId)?.label}</span>
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex gap-2">
                                                                                <Button size="sm" onClick={() => approveMutation.mutate(market.id)} className="bg-green-500 hover:bg-green-600 text-xs h-8">Approve</Button>
                                                                                <Button size="sm" variant="outline" onClick={() => rejectMutation.mutate(market.id)} className="border-red-500/50 text-red-400 hover:bg-red-500/10 text-xs h-8">Reject</Button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-white/10 rounded-2xl bg-white/5 min-h-[300px]">
                                                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                                                <TrendingUp className="w-6 h-6 text-gray-500" />
                                                            </div>
                                                            <p className="text-gray-400 font-medium mb-1">No {tab.label.toLowerCase()} available</p>
                                                            <p className="text-gray-600 text-xs uppercase tracking-widest">Check back later for new markets</p>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div >

            {/* Payment / Registration Modal */}
            {
                tournament && (
                    <PaymentDepositModal
                        isOpen={isPaymentModalOpen}
                        onClose={() => setIsPaymentModalOpen(false)}
                        tournamentId={tournamentId}
                        entryFeeAmount={tournament.entryFeeAmount || 0}
                        entryFeeToken={tournament.entryFeeToken || "PIGGY"}
                        onSuccess={() => {
                            queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] });
                            toast({ title: "Registration Successful", description: "You are now in the tournament!" });
                            setIsPaymentModalOpen(false);
                        }}
                    />
                )
            }

            {/* Market Resolution Modal */}
            <MarketResolutionModal
                isOpen={isResolutionModalOpen}
                onClose={() => setIsResolutionModalOpen(false)}
                market={resolutionMarket}
                tournamentId={tournamentId}
            />


            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="bg-black/60 backdrop-blur-3xl border-white/10 text-white w-[95vw] max-w-md rounded-[var(--radius-piggy-modal)]">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-piggy-title font-black tracking-tighter">Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-400 text-piggy-label font-medium uppercase tracking-tight">
                            This action cannot be undone. This will permanently delete the tournament and remove all data from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-transparent border-white/10 text-white hover:bg-white/5 hover:text-white">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white border-0">
                            {deleteMutation.isPending ? "Deleting..." : "Delete Tournament"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <TournamentEditModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                tournament={tournament}
            />

            <MarketCreateModal
                isOpen={isMarketCreateModalOpen}
                onClose={() => setIsMarketCreateModalOpen(false)}
                tournamentId={tournamentId}
            />

            <MarketEditModal
                isOpen={isMarketEditModalOpen}
                onClose={() => setIsMarketEditModalOpen(false)}
                market={marketToEdit}
                tournamentId={tournamentId}
            />

            {
                isSeedModalOpen && (
                    <SeedDepositModal
                        isOpen={isSeedModalOpen}
                        onClose={() => setIsSeedModalOpen(false)}
                        tournamentId={tournamentId}
                        tournamentName={tournament.name}
                        onSuccess={() => {
                            queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] });
                        }}
                    />
                )
            }

            {
                proofMarket && (
                    <ProofOfSettlementModal
                        isOpen={isProofModalOpen}
                        onClose={() => setIsProofModalOpen(false)}
                        market={proofMarket}
                        tableId={tournament.tableId}
                    />
                )
            }

            {
                !isCartOpen && (
                    <BettingCartFloatingButton onClick={() => setIsCartOpen(true)} />
                )
            }

            <BettingCartDrawer
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                onCheckout={() => {
                    setIsCartOpen(false);
                    setIsTreasuryModalOpen(true);
                }}
                tournament={tournament}
            />

            <TreasuryPaymentModal
                isOpen={isTreasuryModalOpen}
                onClose={() => setIsTreasuryModalOpen(false)}
            />
        </div >
    );
}
