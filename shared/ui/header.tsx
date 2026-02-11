"use client";

import { useState } from "react";
import { Search, LogIn, User, Settings, LogOut, LayoutDashboard, History } from "lucide-react";
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

export function Header() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();
    const { data: session } = useSession();
    const [isLoginOpen, setIsLoginOpen] = useState(false);

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

    return (
        <header className="sticky top-0 z-50 w-full">
            <div className="w-full max-w-6xl mx-auto flex h-20 items-center justify-between px-6 md:px-0">
                {/* Search */}
                <div className="hidden md:flex items-center relative w-full max-w-md">
                    <Search className="absolute left-4 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search games..."
                        className="pl-11 h-11 border-white/5 text-white placeholder:text-gray-400 focus-visible:ring-[var(--color-piggy-deep-pink)] rounded-full text-sm font-medium shadow-inner"
                        defaultValue={searchParams.get('q')?.toString()}
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4 ml-auto">
                    {/* Library Page Actions */}
                    {pathname === '/library' && (
                        <Link href="/library/submit">
                            <Button
                                className="hidden md:flex px-6 py-2.5 h-auto text-sm font-bold text-white bg-[var(--color-piggy-deep-pink)] hover:bg-[var(--color-piggy-deep-pink)]/80 rounded-full transition-all hover:scale-105 shadow-[0_0_15px_rgba(255,47,122,0.4)]"
                            >
                                List Your App
                            </Button>
                        </Link>
                    )}

                    {/* Competitive Hub Actions */}
                    {pathname === '/competitive-hub' && (
                        <Link href="/competitive-hub/host">
                            <Button
                                className="hidden md:flex px-6 py-2.5 h-auto text-sm font-bold text-white bg-[var(--color-piggy-deep-pink)] hover:bg-[var(--color-piggy-deep-pink)]/80 rounded-full transition-all hover:scale-105 shadow-[0_0_15px_rgba(255,47,122,0.4)]"
                            >
                                Host Tournament
                            </Button>
                        </Link>
                    )}

                    <a
                        href="https://piggydao.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hidden lg:flex px-6 py-2.5 text-sm font-bold text-white bg-[var(--color-piggy-deep-pink)] hover:bg-[var(--color-piggy-deep-pink)]/80 rounded-full transition-all hover:scale-105 shadow-[0_0_15px_rgba(255,47,122,0.4)]"
                    >
                        Goto Piggy Club
                    </a>

                    {/* Authentication */}
                    {session ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                                    <Avatar className="h-10 w-10 border-2 border-[var(--color-piggy-deep-pink)]">
                                        <AvatarImage src={session.user?.image || ""} alt={session.user?.name || ""} />
                                        <AvatarFallback className="bg-[var(--color-piggy-deep-pink)] text-white">
                                            {session.user?.name?.charAt(0) || "U"}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56 bg-black/90 border-white/10 text-white backdrop-blur-xl" align="end">
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">{session.user?.name}</p>
                                        <p className="text-xs leading-none text-gray-400">{session.user?.email}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-white/10" />
                                <DropdownMenuItem asChild className="focus:bg-white/10 cursor-pointer">
                                    <Link href="/profile">
                                        <User className="mr-2 h-4 w-4" />
                                        <span>Profile</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild className="focus:bg-white/10 cursor-pointer">
                                    <Link href="/profile/bets">
                                        <History className="mr-2 h-4 w-4" />
                                        <span>My Bets</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild className="focus:bg-white/10 cursor-pointer">
                                    <Link href="/competitive-hub/host">
                                        <LayoutDashboard className="mr-2 h-4 w-4" />
                                        <span>Host Dashboard</span>
                                    </Link>
                                </DropdownMenuItem>

                                {/* TODO: Check if admin */}
                                <DropdownMenuItem asChild className="focus:bg-white/10 cursor-pointer">
                                    <Link href="/admin/bets">
                                        <Settings className="mr-2 h-4 w-4" />
                                        <span>Admin / House</span>
                                    </Link>
                                </DropdownMenuItem>

                                <DropdownMenuSeparator className="bg-white/10" />
                                <DropdownMenuItem
                                    className="text-red-400 focus:bg-red-400/10 focus:text-red-400 cursor-pointer"
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
                            className="bg-white text-black hover:bg-gray-200 rounded-full font-bold px-6 py-2.5 h-auto text-sm shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all hover:scale-105"
                        >
                            <LogIn className="mr-2 h-4 w-4" />
                            Login
                        </Button>
                    )}
                </div>
            </div>

            <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
        </header>
    );
}
