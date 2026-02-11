import { HeroBanner } from "@/features/homepage/hero-banner";
import { YourStats } from "@/features/homepage/your-stats";
import { TopPlayers } from "@/features/homepage/top-players";

export default function Home() {
  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto space-y-8 px-6 md:px-0 pb-20">
      {/* Hero Banner */}
      <HeroBanner />

      {/* Stats Section - Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <YourStats />
        <TopPlayers />
      </div>
    </div>
  );
}
