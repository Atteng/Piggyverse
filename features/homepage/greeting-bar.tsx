"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { getUserProfile } from "@/lib/api/users";
import { cn } from "@/lib/utils";

export function GreetingBar() {
    const { data: session, status } = useSession();

    const { data: userProfile } = useQuery({
        queryKey: ['user', 'me'],
        queryFn: getUserProfile,
        enabled: status === "authenticated",
    });

    const displayName = userProfile?.username || (session?.user as any)?.username || session?.user?.name || session?.user?.email?.split('@')[0] || session?.user?.id?.slice(-8) || "User";

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 18) return "Good afternoon";
        return "Good evening";
    };

    return (
        <div className="w-full flex items-center gap-1.5 mb-2 px-1">
            <p className="text-piggy-body font-mono font-black text-white tracking-tight leading-tight">
                {getGreeting()}, <span className="text-black">{status === "authenticated" ? displayName : "Guest"}</span>
            </p>
            <div className="h-px flex-1 bg-white/10" />
        </div>
    );
}
