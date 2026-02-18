"use client";

import { useState } from "react";
import { Search, LogIn, LogOut, User, Settings, History, ArrowRight, Home, Gamepad2, Trophy, Tv, Bell, Menu, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { LoginModal } from "@/features/auth/login-modal";
import { useSession, signOut } from "next-auth/react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { getUserProfile } from "@/lib/api/users";

import { Suspense } from "react";

function HeaderContent() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();
    const { data: session, status } = useSession();
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [isLogoutOpen, setIsLogoutOpen] = useState(false);
    const [search, setSearch] = useState(searchParams.get('q') || "");

    const { data: userProfile } = useQuery({
        queryKey: ['user', 'me'],
        queryFn: getUserProfile,
        enabled: status === "authenticated",
    });

    // Get display name from profile or session fallback
    const displayName = userProfile?.username || (session?.user as any)?.username || session?.user?.name || session?.user?.email?.split('@')[0] || session?.user?.id?.slice(-8) || "User";

    const handleSearch = (term: string) => {
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set('q', term);
            params.set('page', '1');
        } else {
            params.delete('q');
        }

        if (pathname !== '/library') {
            replace(`/library?${params.toString()}`);
        } else {
            replace(`${pathname}?${params.toString()}`);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearch(search);
        }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 18) return "Good afternoon";
        return "Good evening";
    };

    return (
        <header className="sticky top-0 z-50 w-full pt-4 md:pt-6">
            <nav className="h-14 md:h-20 w-full flex items-center justify-between px-4 md:px-8 transition-all duration-300">
                {/* Desktop Greeting */}
                {pathname === "/" && (
                    <div className="hidden md:flex flex-col">
                        <h1 className="text-2xl font-black text-white font-mono tracking-tight leading-none">
                            {getGreeting()}, <span className="text-black uppercase">{status === "authenticated" ? displayName : "Guest"}</span>
                        </h1>
                    </div>
                )}

                {/* Mobile Left: Logo */}
                <div className="md:hidden flex items-center">
                    <Link href="/">
                        <img src="/logo.png" alt="Piggy" className="w-10 h-10 object-contain" />
                    </Link>
                </div>

                {/* Mobile Center & Right Group: Navigation Dropdown + Auth */}
                <div className="md:hidden flex items-center gap-2">
                    <div className="flex items-center gap-1.5 mr-2">
                        <Link href={pathname.startsWith('/competitive-hub') ? "/competitive-hub/host" : "/library/submit"}>
                            <Button size="icon" className="h-9 w-9 rounded-full bg-white text-black hover:bg-white/90 shadow-lg transition-all active:scale-95 flex items-center justify-center p-0">
                                {pathname.startsWith('/competitive-hub') ? (
                                    <Trophy className="h-4 w-4" />
                                ) : (
                                    <Plus className="h-5 w-5" />
                                )}
                            </Button>
                        </Link>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="bg-black/60 backdrop-blur-md border border-white/10 rounded-full px-4 text-[var(--color-piggy-deep-pink)] text-xs font-black flex items-center gap-2 h-10 shadow-lg min-w-[120px] justify-between hover:bg-black/80 transition-all active:scale-95">
                                <div className="flex items-center gap-2">
                                    {(() => {
                                        const getPageIcon = () => {
                                            if (pathname === "/") return Home;
                                            if (pathname.startsWith("/library")) return Gamepad2;
                                            if (pathname.startsWith("/competitive-hub")) return Trophy;
                                            if (pathname.startsWith("/stream")) return Tv;
                                            if (pathname.startsWith("/notifications")) return Bell;
                                            if (pathname.startsWith("/profile")) return User;
                                            return Menu;
                                        };
                                        const Icon = getPageIcon();
                                        return <Icon className="w-4 h-4 text-[var(--color-piggy-deep-pink)]" strokeWidth={2.5} />;
                                    })()}
                                    <span className="uppercase tracking-widest whitespace-nowrap">
                                        {(() => {
                                            if (pathname === "/") return "Home";
                                            if (pathname.startsWith("/library")) return "Library";
                                            if (pathname.startsWith("/competitive-hub")) return "Compete";
                                            if (pathname.startsWith("/stream")) return "Stream";
                                            if (pathname.startsWith("/notifications")) return "Alerts";
                                            if (pathname.startsWith("/profile")) return "Profile";
                                            return "Menu";
                                        })()}
                                    </span>
                                </div>
                                <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-[var(--color-piggy-deep-pink)] ml-0.5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-64 bg-black/60 backdrop-blur-3xl border border-white/5 text-white rounded-2xl p-2 shadow-2xl" align="end" sideOffset={8}>
                            {/* Menu Items */}
                            <div className="grid gap-0.5">
                                <Link href="/">
                                    <DropdownMenuItem className={cn(
                                        "cursor-pointer rounded-xl px-3 py-2.5 font-bold text-xs flex items-center gap-3 transition-colors",
                                        pathname === "/"
                                            ? "bg-white/10 text-[var(--color-piggy-deep-pink)]"
                                            : "hover:bg-white/5 text-white focus:bg-white/10"
                                    )}>
                                        <Home className={cn("w-3.5 h-3.5", pathname === "/" ? "text-[var(--color-piggy-deep-pink)]" : "text-white/70")} />
                                        Home
                                    </DropdownMenuItem>
                                </Link>
                                <Link href="/library">
                                    <DropdownMenuItem className={cn(
                                        "cursor-pointer rounded-xl px-3 py-2.5 font-bold text-xs flex items-center gap-3 transition-colors",
                                        pathname.startsWith("/library")
                                            ? "bg-white/10 text-[var(--color-piggy-deep-pink)]"
                                            : "hover:bg-white/5 text-white focus:bg-white/10"
                                    )}>
                                        <Gamepad2 className={cn("w-3.5 h-3.5", pathname.startsWith("/library") ? "text-[var(--color-piggy-deep-pink)]" : "text-white/70")} />
                                        Games Library
                                    </DropdownMenuItem>
                                </Link>
                                <Link href="/competitive-hub">
                                    <DropdownMenuItem className={cn(
                                        "cursor-pointer rounded-xl px-3 py-2.5 font-bold text-xs flex items-center gap-3 transition-colors",
                                        pathname.startsWith("/competitive-hub")
                                            ? "bg-white/10 text-[var(--color-piggy-deep-pink)]"
                                            : "hover:bg-white/5 text-white focus:bg-white/10"
                                    )}>
                                        <Trophy className={cn("w-3.5 h-3.5", pathname.startsWith("/competitive-hub") ? "text-[var(--color-piggy-deep-pink)]" : "text-white/70")} />
                                        Competitions
                                    </DropdownMenuItem>
                                </Link>
                                <Link href="/stream">
                                    <DropdownMenuItem className={cn(
                                        "cursor-pointer rounded-xl px-3 py-2.5 font-bold text-xs flex items-center gap-3 transition-colors",
                                        pathname.startsWith("/stream")
                                            ? "bg-white/10 text-[var(--color-piggy-deep-pink)]"
                                            : "hover:bg-white/5 text-white focus:bg-white/10"
                                    )}>
                                        <Tv className={cn("w-3.5 h-3.5", pathname.startsWith("/stream") ? "text-[var(--color-piggy-deep-pink)]" : "text-white/70")} />
                                        Streaming
                                    </DropdownMenuItem>
                                </Link>
                                <Link href="/notifications">
                                    <DropdownMenuItem className={cn(
                                        "cursor-pointer rounded-xl px-3 py-2.5 font-bold text-xs flex items-center gap-3 transition-colors",
                                        pathname.startsWith("/notifications")
                                            ? "bg-white/10 text-[var(--color-piggy-deep-pink)]"
                                            : "hover:bg-white/5 text-white focus:bg-white/10"
                                    )}>
                                        <Bell className={cn("w-3.5 h-3.5", pathname.startsWith("/notifications") ? "text-[var(--color-piggy-deep-pink)]" : "text-white/70")} />
                                        Notifications
                                    </DropdownMenuItem>
                                </Link>
                                <Link href="/profile">
                                    <DropdownMenuItem className={cn(
                                        "cursor-pointer rounded-xl px-3 py-2.5 font-bold text-xs flex items-center gap-3 transition-colors",
                                        pathname.startsWith("/profile")
                                            ? "bg-white/10 text-[var(--color-piggy-deep-pink)]"
                                            : "hover:bg-white/5 text-white focus:bg-white/10"
                                    )}>
                                        <User className={cn("w-3.5 h-3.5", pathname.startsWith("/profile") ? "text-[var(--color-piggy-deep-pink)]" : "text-white/70")} />
                                        Profile
                                    </DropdownMenuItem>
                                </Link>
                            </div>

                            <div className="h-px bg-white/10 my-2 mx-2" />

                            <Link href="/piggy-club">
                                <DropdownMenuItem className="cursor-pointer hover:bg-white/10 rounded-xl focus:bg-white/10 focus:text-white px-3 py-2.5 font-bold text-xs flex items-center gap-3 text-[var(--color-piggy-deep-pink)]">
                                    <img src="/logo.png" alt="Club" className="w-3.5 h-3.5 object-contain" />
                                    Goto Piggy Club
                                </DropdownMenuItem>
                            </Link>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Auth Display for Mobile (Moved inside flex group) */}
                    {status === "loading" ? (
                        <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-white/10 animate-pulse" />
                    ) : session ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-10 w-10 md:h-12 md:w-12 rounded-full p-0.5 overflow-hidden bg-black/60 border border-white/10 hover:bg-black/80 transition-all hover:scale-105 shadow-xl flex items-center justify-center shrink-0">
                                    <Avatar className="h-full w-full rounded-full overflow-hidden">
                                        <AvatarImage src={userProfile?.avatarUrl || session.user?.image || ""} alt={displayName} className="h-full w-full object-cover" />
                                        <AvatarFallback className="h-full w-full bg-[var(--color-piggy-deep-pink)] text-white rounded-full text-lg font-bold flex items-center justify-center">
                                            {displayName.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56 bg-black/60 border border-white/5 text-white backdrop-blur-3xl rounded-2xl p-2 shadow-2xl" align="end" sideOffset={8}>
                                <DropdownMenuLabel className="font-mono text-xs text-gray-400 font-bold tracking-wider mb-2 px-2">
                                    {displayName}
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-white/10" />
                                <Link href="/profile">
                                    <DropdownMenuItem className="cursor-pointer hover:bg-white/10 rounded-lg focus:bg-white/10 focus:text-white px-2 py-2">
                                        <User className="mr-2 h-4 w-4" />
                                        <span>Profile</span>
                                    </DropdownMenuItem>
                                </Link>
                                <Link href="/profile/bets">
                                    <DropdownMenuItem className="cursor-pointer hover:bg-white/10 rounded-lg focus:bg-white/10 focus:text-white px-2 py-2">
                                        <History className="mr-2 h-4 w-4" />
                                        <span>My Bets</span>
                                    </DropdownMenuItem>
                                </Link>
                                <DropdownMenuSeparator className="bg-white/10" />
                                <DropdownMenuItem
                                    className="cursor-pointer hover:bg-red-500/20 text-red-500 hover:text-red-400 rounded-lg focus:bg-red-500/20 focus:text-red-400 px-2 py-2"
                                    onClick={() => signOut()}
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Log out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Button
                            onClick={() => setIsLoginOpen(true)}
                            className="bg-[var(--color-piggy-deep-pink)] hover:bg-[var(--color-piggy-deep-pink)]/80 text-white rounded-full font-bold px-4 md:px-8 h-10 md:h-12 text-xs md:text-sm shadow-[0_0_20px_rgba(255,47,122,0.4)] transition-all hover:scale-105 shrink-0"
                        >
                            <LogIn className="mr-2 h-3 w-3 md:h-4 md:w-4" />
                            Sign In
                        </Button>
                    )}
                </div>

                {/* Desktop Search & Nav */}
                <div className="hidden md:flex items-center gap-3 md:gap-6">
                    {/* Search Bar */}
                    <div className="relative group hidden lg:block">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                            <Search className="h-5 w-5 text-white/50 group-focus-within:text-white transition-colors" strokeWidth={2.5} />
                        </div>
                        <input
                            type="text"
                            placeholder="Find games, players..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="w-[320px] h-12 pl-12 pr-4 bg-black/60 backdrop-blur-3xl border border-white/5 text-white placeholder:text-white/20 rounded-2xl focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/10 transition-all text-sm font-medium shadow-2xl relative z-0"
                        />
                    </div>

                    {/* Navigation Buttons */}
                    <div className="hidden md:flex items-center gap-3">
                        <Link href={pathname.startsWith('/competitive-hub') ? "/competitive-hub/host" : "/library/submit"}>
                            <Button className="bg-white text-black hover:bg-gray-200 rounded-full font-black px-6 h-12 text-sm shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all hover:scale-105 active:scale-95">
                                {pathname.startsWith('/competitive-hub') ? "Host Tournament" : "List App"}
                            </Button>
                        </Link>
                        <Link href="/piggy-club">
                            <Button className="bg-white text-black hover:bg-gray-200 rounded-full font-black px-6 h-12 text-sm shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all hover:scale-105 active:scale-95">
                                Goto Piggy Club
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Desktop Auth Section */}
                <div className="hidden md:flex items-center">
                    {status === "loading" ? (
                        <div className="h-12 w-12 rounded-full bg-white/10 animate-pulse" />
                    ) : session ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-12 w-12 rounded-full p-0 overflow-hidden hover:bg-white/5 transition-all hover:scale-105 shadow-xl">
                                    <Avatar className="h-full w-full border-2 border-[var(--color-piggy-deep-pink)] rounded-full overflow-hidden">
                                        <AvatarImage src={userProfile?.avatarUrl || session.user?.image || ""} alt={displayName} className="h-full w-full object-cover" />
                                        <AvatarFallback className="h-full w-full bg-[var(--color-piggy-deep-pink)] text-white rounded-full text-lg font-bold flex items-center justify-center">
                                            {displayName.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56 bg-black/60 border border-white/5 text-white backdrop-blur-3xl rounded-2xl p-2 shadow-2xl" align="end" sideOffset={8}>
                                <DropdownMenuLabel className="font-mono text-xs text-gray-400 font-bold tracking-wider mb-2 px-2">
                                    {displayName}
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-white/10" />
                                <Link href="/profile">
                                    <DropdownMenuItem className="cursor-pointer hover:bg-white/10 rounded-lg focus:bg-white/10 focus:text-white px-2 py-2">
                                        <User className="mr-2 h-4 w-4" />
                                        <span>Profile</span>
                                    </DropdownMenuItem>
                                </Link>
                                <Link href="/profile/bets">
                                    <DropdownMenuItem className="cursor-pointer hover:bg-white/10 rounded-lg focus:bg-white/10 focus:text-white px-2 py-2">
                                        <History className="mr-2 h-4 w-4" />
                                        <span>My Bets</span>
                                    </DropdownMenuItem>
                                </Link>
                                <DropdownMenuSeparator className="bg-white/10" />
                                <DropdownMenuItem
                                    className="cursor-pointer hover:bg-red-500/20 text-red-500 hover:text-red-400 rounded-lg focus:bg-red-500/20 focus:text-red-400 px-2 py-2"
                                    onClick={() => signOut()}
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Log out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Button
                            onClick={() => setIsLoginOpen(true)}
                            className="bg-[var(--color-piggy-deep-pink)] hover:bg-[var(--color-piggy-deep-pink)]/80 text-white rounded-full font-bold px-8 h-12 text-sm shadow-[0_0_20px_rgba(255,47,122,0.4)] transition-all hover:scale-105"
                        >
                            <LogIn className="mr-2 h-4 w-4" />
                            Sign In
                        </Button>
                    )}
                </div>


            </nav>

            {/* Mobile Greeting Bar */}
            {pathname === "/" && (
                <div className="md:hidden w-full pl-6 pr-2.5 mt-2">
                    <div className="flex items-center gap-1.5">
                        <p className="text-sm font-mono font-black text-white tracking-widest leading-none">
                            {getGreeting()}, <span className="text-black uppercase">{status === "authenticated" ? displayName : "GUEST"}</span>
                        </p>
                        <div className="h-px flex-1 bg-white/5" />
                    </div>
                </div>
            )}

            <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
        </header>
    );
}

export function Header() {
    return (
        <Suspense fallback={<div className="h-20 w-full" />}>
            <HeaderContent />
        </Suspense>
    );
}
