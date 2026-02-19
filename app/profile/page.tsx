import { ProfileHeader } from "@/features/profile/profile-header";
import { PowerLevels } from "@/features/profile/power-levels";
import { StatsGrid } from "@/features/profile/stats-grid";

export default function ProfilePage() {
    return (
        <div className="container max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-8">
            {/* Page Title */}
            <div>
                <h1 className="text-piggy-hero font-bold text-white tracking-tight">Profile</h1>
                <p className="text-white text-piggy-body font-medium mt-1">
                    Your Piggyverse resume and achievements
                </p>
            </div>

            {/* Profile Header */}
            <ProfileHeader />


            {/* Stats Grid */}
            <div>
                <h2 className="text-piggy-title font-bold text-white mb-4">Stats Overview</h2>
                <StatsGrid />
            </div>
        </div>
    );
}
