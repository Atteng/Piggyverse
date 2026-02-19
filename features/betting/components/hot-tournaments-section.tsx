import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTournaments } from "@/lib/api/tournaments";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Flame, Coins, Clock, ChevronRight, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { BetPlacementModal } from "./bet-placement-modal";
import { useRouter } from "next/navigation";

export function HotTournamentsSection() {
    const router = useRouter();

    const { data, isLoading } = useQuery({
        queryKey: ['tournaments', 'hot'],
        queryFn: () => getTournaments('ACTIVE')
    });

    const incentivizedTournaments = data?.tournaments.filter(t => t.isIncentivized) || [];

    // State for betting modal
    const [betModalOpen, setBetModalOpen] = useState(false);
    const [selectedTournament, setSelectedTournament] = useState<any>(null);
    const [selectedOutcomeName, setSelectedOutcomeName] = useState<string>("");
    const [selectedOdds, setSelectedOdds] = useState<number>(0);
    const [selectedMarketId, setSelectedMarketId] = useState<string>("");
    const [selectedOutcomeId, setSelectedOutcomeId] = useState<string>("");
    const [selectedToken, setSelectedToken] = useState<string>("USDC");

    const openBetModal = (tournament: any, outcomeName: string, odds: number, marketId: string, outcomeId: string, token: string) => {
        setSelectedTournament(tournament);
        setSelectedOutcomeName(outcomeName);
        setSelectedOdds(odds);
        setSelectedMarketId(marketId);
        setSelectedOutcomeId(outcomeId);
        setSelectedToken(token);
        setBetModalOpen(true);
    };

    if (isLoading) {
        return (
            <div className="w-full h-64 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--color-piggy-deep-pink)]" />
            </div>
        );
    }

    if (incentivizedTournaments.length === 0) return null;

    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-orange-500/10 rounded-full border border-orange-500/20">
                        <Flame className="w-5 h-5 text-orange-500 fill-orange-500/50 animate-pulse" />
                    </div>
                    <div>
                        <h2 className="text-piggy-title font-bold text-white font-mono leading-none">Hot Tournaments</h2>
                        <p className="text-piggy-label text-gray-400">High stakes events accepting bets now</p>
                    </div>
                </div>
                <Button
                    variant="outline"
                    className="hidden md:flex border-white/10 hover:bg-white/5 text-gray-400 hover:text-white"
                    onClick={() => router.push('/competitive-hub')}
                >
                    See All Tournaments <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {incentivizedTournaments.map(tournament => (
                    <div key={tournament.id} className="group relative bg-[#1a1a1a] border border-white/5 hover:border-[var(--color-piggy-deep-pink)]/50 rounded-2xl overflow-hidden transition-all hover:shadow-[0_0_20px_rgba(255,47,122,0.15)] flex flex-col">
                        {/* Card Header */}
                        <div className="relative h-32 w-full overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-transparent to-transparent z-10" />
                            <img
                                src={tournament.image}
                                alt={tournament.name}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute top-3 right-3 z-20">
                                <Badge className="bg-black/60 backdrop-blur-md border border-[var(--color-piggy-deep-pink)] text-[var(--color-piggy-deep-pink)] font-mono">
                                    <Coins className="w-3 h-3 mr-1" /> {tournament.prizePool}
                                </Badge>
                            </div>
                            <div className="absolute bottom-3 left-3 z-20">
                                <h3 className="font-bold text-white text-piggy-title leading-none shadow-black drop-shadow-md">{tournament.name}</h3>
                                <p className="text-piggy-label text-gray-300 font-mono mt-1">{tournament.game}</p>
                            </div>
                        </div>

                        {/* Betting Options */}
                        <div className="p-4 space-y-3 flex-1 flex flex-col">
                            <div className="flex justify-between items-center text-piggy-tiny text-gray-400 mb-1">
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {tournament.startDate ? formatDistanceToNow(new Date(tournament.startDate), { addSuffix: true }) : tournament.status}
                                </span>
                                <span className="text-[var(--color-piggy-super-green)] font-bold">Incentivized</span>
                            </div>

                            <div className="flex-1 space-y-2">
                                <p className="text-piggy-tiny font-bold text-gray-500 uppercase">Top Odds</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {tournament.topOutcomes && tournament.topOutcomes.length > 0 ? (
                                        tournament.topOutcomes.map((outcome: any) => (
                                            <button
                                                key={outcome.id}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (tournament.activeMarketId) {
                                                        openBetModal(tournament, outcome.label, outcome.odds, tournament.activeMarketId, outcome.id, tournament.token);
                                                    }
                                                }}
                                                className="flex justify-between items-center px-3 py-2 rounded-lg bg-white/5 hover:bg-[var(--color-piggy-deep-pink)]/10 hover:border-[var(--color-piggy-deep-pink)] border border-transparent transition-all group/odd"
                                            >
                                                <span className="text-piggy-label text-gray-300 font-medium truncate max-w-[80px] group-hover/odd:text-white">{outcome.label}</span>
                                                <span className="text-piggy-label font-bold font-mono text-[var(--color-piggy-super-green)]">x{outcome.odds.toFixed(2)}</span>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="col-span-2 text-center py-4 text-xs text-gray-500 italic">
                                            No active odds available
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Button
                                className="w-full mt-2 bg-white/5 hover:bg-white/10 text-white font-bold h-10 rounded-xl"
                                onClick={() => router.push(`/competitive-hub/${tournament.id}`)}
                            >
                                View Tournament <ChevronRight className="w-4 h-4 ml-2 opacity-50" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {selectedTournament && (
                <BetPlacementModal
                    open={betModalOpen}
                    onOpenChange={setBetModalOpen}
                    tournamentName={selectedTournament.name}
                    outcomeName={selectedOutcomeName}
                    marketId={selectedMarketId}
                    outcomeId={selectedOutcomeId}
                    odds={selectedOdds}
                    token={selectedToken}
                />
            )}
        </section>
    );
}
