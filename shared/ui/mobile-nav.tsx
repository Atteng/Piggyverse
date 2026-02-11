
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Gamepad2, Trophy, Tv, User, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileNav() {
    const pathname = usePathname();

    const navItems = [
        { href: "/", icon: Home, label: "Home" },
        { href: "/library", icon: Gamepad2, label: "Library" },
        { href: "/competitive-hub", icon: Trophy, label: "Compete" },
        { href: "/notifications", icon: Bell, label: "Alerts" }, // Added Notification
        { href: "/profile", icon: User, label: "Profile" },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black/80 backdrop-blur-lg md:hidden">
            <div className="flex justify-around items-center h-16">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full text-xs font-medium transition-colors",
                                isActive ? "text-[var(--color-piggy-deep-pink)]" : "text-gray-400 hover:text-white"
                            )}
                        >
                            <item.icon className={cn("h-6 w-6 mb-1", isActive && "text-[var(--color-piggy-deep-pink)]")} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
