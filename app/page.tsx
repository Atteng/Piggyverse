import { HeroBanner } from "@/features/homepage/hero-banner";
import { YourStats } from "@/features/homepage/your-stats";
import { TopPlayers } from "@/features/homepage/top-players";
import { NewGamesSection } from "@/features/homepage/new-games-section";

export default function Home() {
  return (
    <div className="flex flex-col w-full max-w-[1400px] mx-auto space-y-2.5 md:space-y-4 px-2.5 md:px-6 pb-20">
      {/* Top Section: Hero (Most Played) & New Arrivals */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-2.5 md:gap-4">
        <div className="xl:col-span-2">
          <HeroBanner />
        </div>
        <div className="xl:col-span-1 h-full">
          <NewGamesSection />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 md:gap-4">
        <div className="min-h-[200px] md:min-h-[280px]">
          <YourStats />
        </div>
        <div className="min-h-[200px] md:min-h-[280px]">
          <TopPlayers />
        </div>
      </div>
    </div>
  );
}
