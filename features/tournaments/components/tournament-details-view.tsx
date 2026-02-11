"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Trophy, Users, Clock, Calendar, Coins, ArrowLeft, Share2, Info, TrendingUp, Loader2, Shield, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTournamentDetails, registerForTournament, unregisterFromTournament, deleteTournament } from "@/lib/api/tournaments";
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings, Trash2, Edit } from "lucide-react";
import { useTournamentLeaderboard } from "@/hooks/use-tournament-leaderboard";
import { BetPlacementModal } from "@/features/betting/components/bet-placement-modal";
import { useToast } from "@/hooks/use-toast";
import { PaymentDepositModal } from "@/features/tournaments/components/payment-deposit-modal";
import { MarketResolutionModal } from "./market-resolution-modal";

interface TournamentDetailsViewProps {
    tournamentId: string;
}

export function TournamentDetailsView({ tournamentId }: TournamentDetailsViewProps) {
    const router = useRouter();
    const { data: session, status } = useSession();
    const queryClient = useQueryClient();
    const { toast } = useToast();

    // Betting Modal State
    const [selectedMarket, setSelectedMarket] = useState<any>(null);
    const [selectedOutcome, setSelectedOutcome] = useState<any>(null);
    const [isBetModalOpen, setIsBetModalOpen] = useState(false);

    // Resolution Modal State
    const [resolutionMarket, setResolutionMarket] = useState<any>(null);
    const [isResolutionModalOpen, setIsResolutionModalOpen] = useState(false);

    // Fetch Tournament Details
    const { data: tournament, isLoading, error } = useQuery({
        queryKey: ['tournament', tournamentId],
        queryFn: () => getTournamentDetails(tournamentId)
    });

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

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const handleDelete = () => {
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
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

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
    const isHost = session?.user?.id === tournament.host?.id;

    // Filter participants for display (only show paid/confirmed)
    const confirmedParticipants = tournament.registrations?.filter((p: any) =>
        !tournament.entryFeeAmount || tournament.entryFeeAmount === 0 || p.paymentStatus === 'COMPLETED'
    ) || [];

    const progress = ((confirmedParticipants.length || 0) / (tournament.maxPlayers || 2000)) * 100;

    return (
        <div className="w-full max-w-7xl mx-auto pb-20 space-y-8 animate-in fade-in duration-500">
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
                    <img src={tournament.imageUrl || "/bg-2.jpg"} alt={tournament.name} className="w-full h-full object-cover opacity-30" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-[#1a1a1a]/80 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#1a1a1a] via-[#1a1a1a]/50 to-transparent" />
                </div>

                <div className="relative z-10 p-8 md:p-12">
                    <div className="flex items-center justify-between w-full mb-6 relative">
                        <span className="text-sm font-black text-[var(--color-piggy-deep-pink)] uppercase tracking-tighter">
                            {tournament.game?.title || "Game"}
                        </span>
                        <div className="flex gap-2 ml-auto">
                            {isHost && (
                                <Badge className="bg-purple-600 text-white border-0 capitalize px-3 py-1 text-xs font-black uppercase tracking-tighter flex items-center gap-1">
                                    <Shield className="w-3 h-3" /> Host Mode
                                </Badge>
                            )}
                            <Badge className={cn(
                                "text-white border-0 capitalize px-3 py-1 text-xs font-black uppercase tracking-tighter",
                                tournament.status === "ACTIVE" ? "bg-red-500 animate-pulse" :
                                    tournament.status === "PENDING" ? "bg-green-500" : "bg-blue-500"
                            )}>
                                {tournament.status === "PENDING" ? "Registration Open" : tournament.status}
                            </Badge>
                        </div>

                        {isHost && (
                            <div className="ml-4">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="icon" className="border-white/10 bg-black/40 hover:bg-white/10">
                                            <Settings className="w-4 h-4 text-white" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48 bg-[#1a1a1a] border-white/10 text-white">
                                        <DropdownMenuItem disabled className="cursor-not-allowed text-gray-500">
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

                            <p className="text-gray-300 text-lg max-w-2xl font-medium">
                                {tournament.description}
                            </p>

                            <div className="flex flex-wrap gap-6 pt-4 text-sm font-mono text-gray-400">
                                <div className="flex items-center gap-2 font-bold uppercase tracking-tight">
                                    <Info className="w-4 h-4 text-[var(--color-piggy-deep-pink)]" />
                                    {tournament.host?.username || "Unknown Host"}
                                </div>
                                <div className="flex items-center gap-2 font-bold uppercase tracking-tight">
                                    <Calendar className="w-4 h-4 text-[var(--color-piggy-deep-pink)]" />
                                    {tournament.startDate && format(new Date(tournament.startDate), "PPP")}
                                </div>
                                <div className="flex items-center gap-2 font-bold uppercase tracking-tight">
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
                                    <div className="flex items-center gap-2 text-white font-black uppercase tracking-tighter bg-[var(--color-piggy-deep-pink)]/10 px-3 py-1 rounded-full border border-[var(--color-piggy-deep-pink)]/20">
                                        <Coins className="w-4 h-4 text-[var(--color-piggy-deep-pink)]" />
                                        Prize Pool: {tournament.prizePoolAmount} {tournament.prizePoolToken}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col gap-4 w-full">
                            <div className="bg-black/50 backdrop-blur-md p-4 rounded-2xl border border-white/10 space-y-2">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-400 flex items-center gap-2 font-bold uppercase tracking-tight"><Users className="w-4 h-4" /> Participants</span>
                                    <span className="text-white font-black tracking-tighter">{confirmedParticipants.length} / {tournament.maxPlayers}</span>
                                </div>
                                <Progress value={progress} className="h-2 bg-white/10" indicatorClassName="bg-[var(--color-piggy-super-green)]" />
                            </div>

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
                                        className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-black uppercase tracking-tighter h-12 rounded-xl shadow-[0_0_20px_rgba(234,179,8,0.4)]"
                                    >
                                        Complete Payment
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={handleRegisterClick}
                                        disabled={registerMutation.isPending || (confirmedParticipants.length >= tournament.maxPlayers)}
                                        className="flex-1 bg-[var(--color-piggy-deep-pink)] hover:bg-[var(--color-piggy-deep-pink)]/80 text-white font-black uppercase tracking-tighter h-12 rounded-xl shadow-[0_0_20px_rgba(255,47,122,0.4)]"
                                    >
                                        {registerMutation.isPending ? "Registering..." :
                                            tournament.status === "ACTIVE" ? "Watch Stream" : "Register Now"}
                                    </Button>
                                )}

                                <Button variant="outline" className="h-12 w-12 rounded-xl border-white/10 bg-black/40 hover:bg-white/10">
                                    <Share2 className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Tabs */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-8 md:p-12 pt-0">
                    <div className="lg:col-span-3">
                        <Tabs defaultValue="overview" className="w-full">
                            <TabsList className="bg-black/40 border border-white/10 w-full justify-start p-1 h-auto rounded-xl">
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

                            <TabsContent value="overview" className="mt-6 space-y-6">
                                <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                                    <h3 className="text-xl font-bold text-white mb-4">About this Tournament</h3>
                                    <p className="text-gray-400 leading-relaxed">
                                        {tournament.description} This is an official verified tournament hosted by the PiggyDAO competitive council.
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

                            <TabsContent value="rules" className="mt-6">
                                <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                                    <h3 className="text-xl font-bold text-white mb-4">Official Rules</h3>
                                    {(tournament.rules && Array.isArray(tournament.rules)) ? (
                                        <ul className="space-y-3">
                                            {tournament.rules.map((rule: string, i: number) => (
                                                <li key={i} className="flex items-start gap-3 text-gray-300">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-piggy-deep-pink)] mt-2" />
                                                    {rule}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-gray-400 whitespace-pre-wrap">{tournament.rules || "No specific rules listed."}</p>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="prizes" className="mt-6">
                                <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                                    <h3 className="text-xl font-bold text-white mb-4">Prize Pool Distribution</h3>
                                    <div className="space-y-3">
                                        {tournament.prizeDistribution ? (
                                            <p className="text-gray-400 whitespace-pre-wrap font-mono text-sm leading-relaxed">
                                                {typeof tournament.prizeDistribution === 'string'
                                                    ? tournament.prizeDistribution
                                                    : JSON.stringify(tournament.prizeDistribution, null, 2)}
                                            </p>
                                        ) : (
                                            <div className="text-gray-400">Prize distribution details coming soon.</div>
                                        )}
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="participants" className="mt-6">
                                <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                                    <h3 className="text-xl font-bold text-white mb-4">Participants ({confirmedParticipants.length})</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {confirmedParticipants.map((p: any) => (
                                            <div key={p.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/5">
                                                <div className="w-8 h-8 bg-[var(--color-piggy-deep-pink)] rounded-full flex items-center justify-center font-bold text-xs">
                                                    {p.user.username?.[0] || "U"}
                                                </div>
                                                <span className="font-bold text-gray-300">{p.user.username || "Anonymous"}</span>
                                            </div>
                                        ))}
                                        {confirmedParticipants.length === 0 && <div className="text-gray-400">No participants yet.</div>}
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="betting" className="mt-6">
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-2xl font-black text-white flex items-center gap-2">
                                                <Coins className="w-6 h-6 text-[var(--color-piggy-deep-pink)]" />
                                                Betting Markets
                                            </h3>
                                            <p className="text-sm text-gray-400 mt-1">
                                                {tournament.bettingMarkets?.length || 0} active markets available.
                                            </p>
                                        </div>
                                    </div>

                                    {tournament.bettingMarkets?.map((market: any) => (
                                        <div key={market.id} className="bg-black/40 backdrop-blur-xl border border-[var(--color-piggy-deep-pink)]/30 rounded-3xl p-6 relative overflow-hidden">
                                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Badge variant="outline" className="text-[var(--color-piggy-deep-pink)] border-[var(--color-piggy-deep-pink)]">
                                                            {market.marketType}
                                                        </Badge>
                                                        {market.status === "RESOLVED" && (
                                                            <Badge className="bg-green-500/20 text-green-400 border border-green-500/50 flex items-center gap-1">
                                                                <CheckCircle2 className="w-3 h-3" /> Resolved
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <h3 className="text-xl font-bold text-white max-w-xl">
                                                        {market.marketQuestion}
                                                    </h3>
                                                </div>

                                                {isHost && market.status !== "RESOLVED" && (
                                                    <Button
                                                        onClick={() => handleResolveClick(market)}
                                                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-[0_0_15px_rgba(147,51,234,0.4)]"
                                                    >
                                                        <Shield className="w-4 h-4 mr-2" /> Resolve Market
                                                    </Button>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {market.outcomes && market.outcomes.length > 0 ? (
                                                    market.outcomes.map((outcome: any) => {
                                                        const isWinner = market.status === "RESOLVED" && market.winningOutcomeId === outcome.id;
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
                                                                    isWinner ? "text-green-400" : "text-gray-300 group-hover:text-white"
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
                                                    <div className="col-span-full text-center text-gray-500 italic py-2">
                                                        No outcomes defined.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {(!tournament.bettingMarkets || tournament.bettingMarkets.length === 0) && (
                                        <div className="text-gray-400 text-center py-10 bg-black/20 rounded-2xl border border-white/5">
                                            No active markets available.
                                        </div>
                                    )}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>

            {/* Bet Placement Modal */}
            {selectedOutcome && (
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
            )}

            {/* Payment / Registration Modal */}
            {tournament && (
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
            )}

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
        </div>
    );
}
