"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Gamepad2, Trophy, Tv, Bell, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Library", href: "/library", icon: Gamepad2 },
    { name: "Competitive", href: "/competitive-hub", icon: Trophy },
    { name: "Stream", href: "/stream", icon: Tv },
    { name: "Notifications", href: "/notifications", icon: Bell },
    { name: "Profile", href: "/profile", icon: User },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <>
            {/* Desktop Sidebar - Fixed Left, Icon Only */}
            <aside className="hidden md:flex flex-col w-[100px] h-screen fixed left-0 top-0 border-r border-white/5 bg-black/40 backdrop-blur-xl z-40 items-center py-8">

                {/* Logo - Icon Only */}
                <div className="mb-12 relative w-12 h-12">
                    <Link href="/">
                        <img src="/logo.png" alt="Logo" className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(255,47,122,0.5)]" />
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex flex-col gap-6 w-full px-4 items-center">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "relative flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 group",
                                    isActive
                                        ? "bg-[var(--color-piggy-deep-pink)] text-white shadow-[0_0_15px_rgba(255,47,122,0.6)] scale-110"
                                        : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                                )}
                            >
                                <Icon className={cn("h-6 w-6", isActive && "fill-current")} strokeWidth={isActive ? 2.5 : 2} />

                                {/* Tooltip on hover */}
                                <span className="absolute left-16 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10 z-50">
                                    {item.name}
                                </span>

                                {isActive && (
                                    <div className="absolute -right-[22px] top-1/2 -translate-y-1/2 w-1 h-8 bg-[var(--color-piggy-deep-pink)] rounded-l-full hidden" />
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-black/90 backdrop-blur-xl border-t border-white/10 z-50 flex items-center justify-around px-4 pb-safe">
                {navItems.slice(0, 5).map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center p-2 rounded-lg transition-colors",
                                isActive ? "text-[var(--color-piggy-deep-pink)]" : "text-gray-500"
                            )}
                        >
                            <Icon className={cn("h-6 w-6", isActive && "fill-current")} />
                        </Link>
                    );
                })}
            </nav>
        </>
    );
}
