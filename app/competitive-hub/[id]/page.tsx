import { TournamentDetailsView } from "@/features/tournaments/components/tournament-details-view";

export default async function TournamentPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <TournamentDetailsView tournamentId={id} />;
}
