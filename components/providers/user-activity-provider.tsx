"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

export function UserActivityProvider({ children }: { children: React.ReactNode }) {
    const { status } = useSession();

    useEffect(() => {
        if (status === "authenticated") {
            // Sync user activity (update streak, last seen)
            fetch("/api/user/sync", { method: "POST" })
                .then((res) => res.json())
                .catch((err) => console.error("Failed to sync user activity:", err));
        }
    }, [status]);

    return <>{children}</>;
}
