"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
    const [isLoading, setIsLoading] = useState<string | null>(null);

    const handleLogin = async (provider: string) => {
        try {
            setIsLoading(provider);
            await signIn(provider, { callbackUrl: "/profile" });
        } catch (error) {
            console.error("Login failed:", error);
        } finally {
            setIsLoading(null);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                showCloseButton={false}
                className="w-[95vw] max-w-[340px] sm:max-w-md bg-black/60 border-white/5 text-white backdrop-blur-3xl rounded-[var(--radius-piggy-modal)] p-6 md:p-8"
            >
                <DialogHeader className="space-y-1 mt-4">
                    <DialogTitle className="text-piggy-title font-black text-center font-mono tracking-tighter leading-[0.8] mb-1">
                        Welcome to <span className="text-[var(--color-piggy-deep-pink)]">PiggyVerse</span>
                    </DialogTitle>
                    <DialogDescription className="text-center text-white/40 font-medium text-piggy-body leading-tight">
                        Connect your account to compete, bet, and earn.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-3 py-6">
                    <Button
                        variant="outline"
                        onClick={() => handleLogin('twitter')}
                        disabled={!!isLoading}
                        className="w-full h-12 bg-[#1DA1F2]/5 border-white/5 hover:bg-[#1DA1F2]/10 text-white font-bold rounded-full transition-all"
                    >
                        {isLoading === 'twitter' ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <svg className="mr-2 h-5 w-5 fill-current" viewBox="0 0 24 24">
                                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                            </svg>
                        )}
                        Sign in with Twitter
                    </Button>

                    <Button
                        variant="outline"
                        onClick={() => handleLogin('discord')}
                        disabled={!!isLoading}
                        className="w-full h-12 bg-[#5865F2]/5 border-white/5 hover:bg-[#5865F2]/10 text-white font-bold rounded-full transition-all"
                    >
                        {isLoading === 'discord' ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <svg className="mr-2 h-5 w-5 fill-current" viewBox="0 0 127.14 96.36">
                                <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.11,77.11,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.89,105.89,0,0,0,126.6,80.22c1.24-23.61-4.22-47.56-18.9-72.15ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.45-12.74S54,46,54,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.25-12.74S95.74,46,95.74,53,90.62,65.69,84.69,65.69Z" />
                            </svg>
                        )}
                        Sign in with Discord
                    </Button>
                </div>

                <div className="text-center text-piggy-tiny text-white/20 font-mono px-4 leading-tight">
                    By connecting, you agree to our Terms of Service and Privacy Policy.
                </div>
            </DialogContent>
        </Dialog>
    );
}
