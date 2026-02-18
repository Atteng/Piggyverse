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
            <aside className="hidden md:flex flex-col w-[120px] h-screen fixed left-0 top-0 z-40 items-center py-8">
                {/* Main Dark Container */}
                <div className="flex flex-col items-center py-8 bg-black/60 backdrop-blur-2xl border border-white/5 w-20 h-fit rounded-[2rem] mt-8 shadow-2xl pb-10">
                    {/* Logo */}
                    <Link href="/" className="mb-10 group transition-transform hover:scale-110 active:scale-95">
                        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
                        </div>
                    </Link>

                    {/* Navigation */}
                    <nav className="flex flex-col gap-5 items-center w-full px-2">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 group",
                                        isActive
                                            ? "bg-[var(--color-piggy-deep-pink)] text-white shadow-[0_0_20px_rgba(255,47,122,0.5)] scale-110"
                                            : "text-gray-400 hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    <Icon className={cn("h-6 w-6", isActive && "fill-current")} strokeWidth={isActive ? 2.5 : 2} />

                                    {/* Tooltip on hover */}
                                    <span className="absolute left-16 bg-black/90 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none border border-white/10 z-50 translate-x-[-10px] group-hover:translate-x-0 tracking-wide capitalize">
                                        {item.name}
                                    </span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </aside>
        </>
    );
}
