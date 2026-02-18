import { TournamentDetailsView } from "@/features/tournaments/components/tournament-details-view";

export default async function TournamentPage(props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        if (!params?.id) {
            console.error("TournamentPage: Missing params or id", params);
            return <div className="p-8 text-center text-red-400">Error: Invalid tournament URL parameters.</div>;
        }

        return <TournamentDetailsView tournamentId={params.id} />;
    } catch (error) {
        console.error("TournamentPage Error:", error);
        return <div className="p-8 text-center text-red-500">Something went wrong loading the tournament.</div>;
    }
}
