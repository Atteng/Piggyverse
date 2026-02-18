
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
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/5 bg-black/60 backdrop-blur-3xl md:hidden rounded-t-[2rem] shadow-2xl">
            <div className="flex justify-around items-center h-20">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                                isActive ? "text-[var(--color-piggy-deep-pink)] scale-110" : "text-white/40 hover:text-white"
                            )}
                        >
                            <item.icon className={cn("h-6 w-6 mb-1.5", isActive && "fill-current")} strokeWidth={isActive ? 3 : 2} />
                            <span className={cn(isActive ? "opacity-100" : "opacity-0 h-0 overflow-hidden")}>{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
