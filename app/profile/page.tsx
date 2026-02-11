import { ProfileHeader } from "@/features/profile/profile-header";
import { PowerLevels } from "@/features/profile/power-levels";
import { StatsGrid } from "@/features/profile/stats-grid";

export default function ProfilePage() {
    return (
        <div className="container max-w-6xl mx-auto p-4 lg:p-8 space-y-8">
            {/* Page Title */}
            <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Profile</h1>
                <p className="text-white font-medium mt-1">
                    Your Piggyverse resume and achievements
                </p>
            </div>

            {/* Profile Header */}
            <ProfileHeader />

            {/* Power Levels Section */}
            <div>
                <h2 className="text-xl font-bold text-white mb-4">Power Levels (50/35/15)</h2>
                <PowerLevels />
            </div>

            {/* Stats Grid */}
            <div>
                <h2 className="text-xl font-bold text-white mb-4">Stats Overview</h2>
                <StatsGrid />
            </div>
        </div>
    );
}
