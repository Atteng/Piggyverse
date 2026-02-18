"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Trophy, Users, Clock, Calendar, Coins, ArrowLeft, Share2, Info, TrendingUp, Loader2, Shield, CheckCircle2, Plus, Wifi, XCircle, Gavel, FileSignature } from "lucide-react";
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
import { getTournamentDetails, registerForTournament, unregisterFromTournament, deleteTournament, createTournament, resolveMarket, syncTournamentResults } from "@/lib/api/tournaments";
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
import { BetPlacementModal } from "@/features/betting/components/bet-placement-modal";
import { useToast } from "@/hooks/use-toast";
import { PaymentDepositModal } from './payment-deposit-modal';
import { MarketResolutionModal } from "./market-resolution-modal";
import { TournamentEditModal } from "./tournament-edit-modal";
import { MarketEditModal } from "./market-edit-modal";
import { SeedDepositModal } from "./seed-deposit-modal";
import { MarketCreateModal } from "./market-create-modal";
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

    // Betting Modal State
    const [selectedMarket, setSelectedMarket] = useState<any>(null);
    const [selectedOutcome, setSelectedOutcome] = useState<any>(null);
    const [isBetModalOpen, setIsBetModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSeedModalOpen, setIsSeedModalOpen] = useState(false);

    // Fetch Tournament Details
    const { data: tournament, isLoading, error } = useQuery({
        queryKey: ['tournament', tournamentId],
        queryFn: () => getTournamentDetails(tournamentId)
    });

    // Resolution Modal State
    const [resolutionMarket, setResolutionMarket] = useState<any>(null);
    const [isResolutionModalOpen, setIsResolutionModalOpen] = useState(false);

    // Edit Market Modal State
    const [marketToEdit, setMarketToEdit] = useState<any>(null);
    const [isMarketEditModalOpen, setIsMarketEditModalOpen] = useState(false);
    const [isMarketCreateModalOpen, setIsMarketCreateModalOpen] = useState(false);

    // Tabs State
    const [activeTab, setActiveTab] = useState("overview");

    // Countdown Logic
    const [timeLeft, setTimeLeft] = useState<string>("");
    const [isRegistrationExpired, setIsRegistrationExpired] = useState(false);

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

    // Mutation: Sync Results
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

    const handleBetClick = (market: any, outcome: any) => {
        if (market.status !== "ACTIVE") return; // Prevent betting on closed markets
        if (status !== "authenticated") {
            signIn();
            return;
        }
        setSelectedMarket(market);
        setSelectedOutcome(outcome);
        setIsBetModalOpen(true);
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
                            <h1 className="text-4xl md:text-6xl font-black text-white font-mono tracking-tighter uppercase leading-none">
                                {tournament.name}
                            </h1>

                            <p className="text-gray-300 text-sm max-w-2xl font-medium leading-snug">
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
                                                    <h3 className="text-white text-sm font-black uppercase tracking-tighter">
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
                                            Prize Pool: {tournament.prizePoolAmount} {tournament.prizePoolToken}
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
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-400 flex items-center gap-2 font-bold uppercase tracking-tight"><Users className="w-4 h-4" /> Participants</span>
                                    <span className="text-white font-black tracking-tighter">{confirmedParticipants.length} / {tournament.maxPlayers}</span>
                                </div>
                                <Progress value={progress} className="h-2 bg-white/10" indicatorClassName="bg-[var(--color-piggy-super-green)]" />
                            </div>

                            <div className="flex flex-col gap-2">
                                <div className="flex gap-3">
                                    {isRegistered ? (
                                        <Button
                                            onClick={() => unregisterMutation.mutate()}
                                            disabled={unregisterMutation.isPending}
                                            variant="destructive"
                                            className="flex-1 font-black uppercase tracking-tighter h-12 rounded-xl"
                                        >
                                            {unregisterMutation.isPending ? "Leaving..." : "Unregister"}
                                        </Button>
                                    ) : isPendingPayment ? (
                                        <Button
                                            onClick={() => setIsPaymentModalOpen(true)}
                                            disabled={isRegistrationExpired}
                                            className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-black uppercase tracking-tighter h-12 rounded-xl shadow-[0_0_20px_rgba(234,179,8,0.4)] disabled:opacity-50"
                                        >
                                            {isRegistrationExpired ? "Registration Closed" : "Complete Payment"}
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={handleRegisterClick}
                                            disabled={registerMutation.isPending || (confirmedParticipants.length >= tournament.maxPlayers) || (isRegistrationExpired && tournament.status === 'PENDING')}
                                            className="flex-1 bg-[var(--color-piggy-deep-pink)] hover:bg-[var(--color-piggy-deep-pink)]/80 text-white font-black uppercase tracking-tighter h-12 rounded-xl shadow-[0_0_20px_rgba(255,47,122,0.4)] disabled:opacity-50 disabled:grayscale"
                                        >
                                            {registerMutation.isPending ? "Registering..." :
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
                                    <Button
                                        onClick={() => setIsSeedModalOpen(true)}
                                        className="w-full bg-zinc-700 hover:bg-zinc-600 text-white font-black uppercase tracking-tighter h-10 rounded-xl border border-white/10 text-xs"
                                    >
                                        Seed Prize Pool
                                    </Button>
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
                                                className="focus:bg-white/10 focus:text-white cursor-pointer py-3 font-mono text-xs uppercase tracking-wider text-white hover:text-white hover:bg-white/5"
                                            >
                                                {tab}
                                            </SelectItem>
                                        ))}
                                        {tournament.allowBetting && (
                                            <SelectItem
                                                value="betting"
                                                className="focus:bg-white/10 focus:text-white cursor-pointer py-3 font-mono text-xs uppercase tracking-wider text-white hover:text-white hover:bg-white/5"
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
                                        className="data-[state=active]:bg-[var(--color-piggy-deep-pink)] data-[state=active]:text-white text-gray-400 py-3 px-6 rounded-lg font-bold font-mono text-sm uppercase"
                                    >
                                        {tab}
                                    </TabsTrigger>
                                ))}
                                {tournament.allowBetting && (
                                    <TabsTrigger
                                        value="betting"
                                        className="data-[state=active]:bg-[var(--color-piggy-deep-pink)] data-[state=active]:text-white text-gray-400 py-3 px-6 rounded-lg font-bold font-mono text-sm uppercase"
                                    >
                                        Betting
                                    </TabsTrigger>
                                )}
                            </TabsList>

                            <TabsContent value="overview" className="mt-2 md:mt-6 space-y-3 md:space-y-6">
                                <div className="bg-black/60 backdrop-blur-3xl border border-white/10 rounded-2xl p-4 md:p-6">
                                    <h3 className="text-xs font-mono font-black uppercase tracking-widest text-[var(--color-piggy-deep-pink)] mb-3">About this Tournament</h3>
                                    <p className="text-gray-400 text-sm leading-snug">
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
                                        {confirmedParticipants.map((p: any) => {
                                            const assignedCode = isHost ? tournament.inviteCodes?.find((c: any) => c.usedByUserId === p.user.id)?.code : null;
                                            return (
                                                <div key={p.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 group hover:border-white/10 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-black/40 rounded-full flex items-center justify-center font-bold text-xs text-[var(--color-piggy-deep-pink)] border border-white/5">
                                                            {p.user.username?.[0] || "U"}
                                                        </div>
                                                        <span className="font-bold text-gray-400 text-sm">{p.user.username || "Anonymous"}</span>
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

                            <TabsContent value="betting" className="mt-2 md:mt-6">
                                <div className="flex flex-col gap-[10px]">
                                    {/* Host Actions Toolbar */}
                                    {isHost && (
                                        <div className="bg-[var(--color-piggy-deep-pink)]/10 border border-[var(--color-piggy-deep-pink)]/30 rounded-2xl p-4 relative z-40 block">
                                            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                                <div className="flex items-center gap-3">
                                                    <Shield className="w-5 h-5 text-[var(--color-piggy-deep-pink)]" />
                                                    <span className="font-mono font-bold text-white uppercase tracking-wider text-sm">Host Controls</span>
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
                                                                            className="hover:bg-white/10 focus:bg-white/10 cursor-pointer font-mono text-xs uppercase tracking-wider py-2"
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

                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div>
                                            <h3 className="text-sm md:text-2xl font-mono font-black uppercase tracking-widest text-white flex items-center gap-2">
                                                <Coins className="w-5 h-5 md:w-6 md:h-6 text-[var(--color-piggy-deep-pink)]" />
                                                Betting Markets
                                            </h3>
                                            <p className="text-sm text-gray-400 mt-1">
                                                {tournament.bettingMarkets?.length || 0} active markets available.
                                            </p>
                                        </div>
                                    </div>

                                    {tournament.bettingMarkets?.map((market: any) => (
                                        <div key={market.id} className="bg-black/60 backdrop-blur-3xl border border-white/10 rounded-3xl p-6 relative overflow-hidden">
                                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Badge variant="outline" className="text-[var(--color-piggy-deep-pink)] border-[var(--color-piggy-deep-pink)]">
                                                            {market.marketType}
                                                        </Badge>
                                                        {market.status === "SETTLED" && (
                                                            <Badge className="bg-green-500/20 text-green-400 border border-green-500/50 flex items-center gap-1">
                                                                <CheckCircle2 className="w-3 h-3" /> Resolved
                                                            </Badge>
                                                        )}
                                                        {market.status === "OPEN" && market.isAutonomous && (
                                                            <Badge variant="outline" className="animate-pulse border-[var(--color-piggy-cyan)] text-[var(--color-piggy-cyan)] flex items-center gap-1">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-piggy-cyan)]"></span>
                                                                LIVE ODDS
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <h3 className="text-sm md:text-xl font-bold text-white max-w-xl">
                                                        {market.marketQuestion}
                                                    </h3>
                                                </div>


                                                {isHost && market.status !== "SETTLED" && (
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => {
                                                            setMarketToEdit(market);
                                                            setIsMarketEditModalOpen(true);
                                                        }}
                                                        className="border-white/10 bg-black/40 hover:bg-white/10"
                                                    >
                                                        <Edit className="w-4 h-4 text-white" />
                                                    </Button>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {market.outcomes && market.outcomes.length > 0 ? (
                                                    market.outcomes.map((outcome: any) => {
                                                        const isWinner = market.status === "SETTLED" && market.winningOutcomeId === outcome.id;
                                                        return (
                                                            <div
                                                                key={outcome.id}
                                                                onClick={() => handleBetClick(market, outcome)}
                                                                className={cn(
                                                                    "flex items-center justify-between py-3 px-4 rounded-lg border transition-all group",
                                                                    market.status === "ACTIVE"
                                                                        ? "bg-black/20 border-white/5 hover:border-[var(--color-piggy-deep-pink)]/50 cursor-pointer"
                                                                        : "bg-black/10 border-white/5 cursor-default",
                                                                    isWinner && "bg-green-500/10 border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.2)]"
                                                                )}
                                                            >
                                                                <span className={cn(
                                                                    "font-bold text-sm",
                                                                    isWinner ? "text-green-400" : "text-gray-400 group-hover:text-white"
                                                                )}>
                                                                    {outcome.label} {isWinner && "(WINNER)"}
                                                                </span>
                                                                <span className="font-mono font-bold text-sm text-[var(--color-piggy-super-green)] bg-[var(--color-piggy-super-green)]/10 px-3 py-1.5 rounded-md min-w-[60px] text-center">
                                                                    {outcome.weight ? `x${outcome.weight}` : "-"}
                                                                </span>
                                                            </div>
                                                        );
                                                    })
                                                ) : (
                                                    <div className="col-span-full text-center text-gray-400 text-sm italic py-2">
                                                        No outcomes defined.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {(!tournament.bettingMarkets || tournament.bettingMarkets.length === 0) && (
                                        <div className="text-gray-400 text-sm leading-snug text-center py-10 bg-black/20 rounded-2xl border border-white/5">
                                            No active markets available.
                                        </div>
                                    )}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div >

            {/* Bet Placement Modal */}
            {
                selectedOutcome && (
                    <BetPlacementModal
                        open={isBetModalOpen}
                        onOpenChange={setIsBetModalOpen}
                        marketId={selectedMarket?.id}
                        outcomeId={selectedOutcome?.id}
                        tournamentName={tournament.name}
                        outcomeName={selectedOutcome?.label}
                        odds={selectedOutcome?.currentOdds || 1.0}
                        minBet={selectedMarket?.minBet || 1}
                        maxBet={selectedMarket?.maxBet || 1000}
                        token={selectedMarket?.poolPreSeedToken || "USDC"}
                    />
                )
            }

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
                <AlertDialogContent className="bg-[#1a1a1a] border-white/10 text-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-400">
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

            {tournament && (
                <SeedDepositModal
                    isOpen={isSeedModalOpen}
                    onClose={() => setIsSeedModalOpen(false)}
                    tournamentId={tournamentId}
                    tournamentName={tournament.name}
                    onSuccess={() => {
                        queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] });
                    }}
                />
            )}
        </div >
    );
}
