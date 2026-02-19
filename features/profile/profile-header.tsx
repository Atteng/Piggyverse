"use client";

import { Twitter, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useSession, signIn } from "next-auth/react";

interface User {
    id: string;
    username: string;
    avatarUrl?: string | null;
    globalRank: number;
    twitterHandle?: string | null;
    twitterConnected: boolean;
    discordHandle?: string | null;
    discordConnected: boolean;
    createdAt: string;
}

export function ProfileHeader() {
    const { data: session } = useSession();

    const { data: user, isLoading } = useQuery<User>({
        queryKey: ['user', 'me'],
        queryFn: async () => {
            const res = await fetch('/api/users/me');
            if (!res.ok) throw new Error('Failed to fetch user');
            return res.json();
        },
        enabled: !!session,
    });

    if (isLoading) {
        return (
            <div className="bg-black/60 backdrop-blur-3xl border border-white/10 rounded-3xl p-8 flex items-center justify-center h-48">
                <Loader2 className="w-8 h-8 text-white/50 animate-spin" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="bg-black/60 backdrop-blur-3xl border border-white/10 rounded-3xl p-8 text-center">
                <p className="text-white/50 text-piggy-body">Please sign in to view your profile</p>
            </div>
        );
    }

    return (
        <div className="bg-black/60 backdrop-blur-3xl border border-white/10 rounded-3xl p-8">
            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6">
                {/* Avatar */}
                <div className="relative shrink-0">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/20 bg-white/5">
                        {user.avatarUrl ? (
                            <img
                                src={user.avatarUrl}
                                alt={user.username}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-piggy-hero font-bold text-white uppercase">
                                {user.username[0]}
                            </div>
                        )}
                    </div>
                    {/* Rank Badge */}
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[var(--color-piggy-deep-pink)] text-white text-piggy-label font-bold px-4 py-1 rounded-full border-2 border-black shadow-lg">
                        #{user.globalRank}
                    </div>
                </div>

                {/* User Info - Center */}
                <div className="flex-1 text-center lg:text-left">
                    <h1 className="text-piggy-title font-bold text-white mb-2">{user.username}</h1>
                    <p className="text-white/60 text-piggy-body mb-4">
                        Member since {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </p>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full">
                        <span className="text-piggy-label font-bold text-white/60 uppercase tracking-tight">Global Rank</span>
                        <span className="text-piggy-title font-bold text-[var(--color-piggy-deep-pink)]">#{user.globalRank}</span>
                    </div>
                </div>

                {/* Linked Accounts - Right Side */}
                <div className="flex flex-col gap-2 shrink-0">
                    <p className="text-piggy-label text-white/40 uppercase tracking-tight mb-1 text-center lg:text-right">Linked Accounts</p>

                    {/* Twitter */}
                    {user.twitterConnected ? (
                        <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg">
                            <Twitter className="w-4 h-4 text-white" />
                            <span className="text-piggy-label text-white font-medium">
                                {user.twitterHandle || "Linked"}
                            </span>
                        </div>
                    ) : (
                        <button
                            onClick={() => signIn('twitter')}
                            className="flex items-center gap-2 px-3 py-2 bg-[var(--color-piggy-deep-pink)]/10 hover:bg-[var(--color-piggy-deep-pink)]/20 border border-[var(--color-piggy-deep-pink)]/50 rounded-lg transition-colors group"
                        >
                            <Twitter className="w-4 h-4 text-[var(--color-piggy-deep-pink)]" />
                            <span className="text-piggy-label text-[var(--color-piggy-deep-pink)] font-bold group-hover:text-white transition-colors">
                                Connect Twitter
                            </span>
                        </button>
                    )}

                    {/* Discord */}
                    {user.discordConnected ? (
                        <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg">
                            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                            </svg>
                            <span className="text-piggy-label text-white font-medium">
                                {user.discordHandle || "Linked"}
                            </span>
                        </div>
                    ) : (
                        <button
                            onClick={() => signIn('discord')}
                            className="flex items-center gap-2 px-3 py-2 bg-[var(--color-piggy-deep-pink)]/10 hover:bg-[var(--color-piggy-deep-pink)]/20 border border-[var(--color-piggy-deep-pink)]/50 rounded-lg transition-colors group"
                        >
                            <svg className="w-4 h-4 text-[var(--color-piggy-deep-pink)]" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                            </svg>
                            <span className="text-piggy-label text-[var(--color-piggy-deep-pink)] font-bold group-hover:text-white transition-colors">
                                Connect Discord
                            </span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
