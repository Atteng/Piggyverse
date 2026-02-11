
"use client";

import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const activities = [
    { id: 1, user: "PiggyKing", action: "won 500 $PIGGY", time: "2m ago", image: "/images/avatars/1.jpg" },
    { id: 2, user: "CryptoSlayer", action: "joined Poker Night", time: "5m ago", image: "/images/avatars/2.jpg" },
    { id: 3, user: "NoobMaster", action: "placed 100 $UP bet", time: "8m ago", image: "/images/avatars/3.jpg" },
    { id: 4, user: "WhaleAlert", action: "created High Roller Tourney", time: "12m ago", image: "/images/avatars/4.jpg" },
];

export function LiveFeed() {
    return (
        <div className="w-full bg-black/40 backdrop-blur-sm border-y border-white/5 py-2 overflow-hidden flex items-center">
            <div className="flex items-center gap-2 px-4 border-r border-white/10 shrink-0">
                <div className="w-2 h-2 rounded-full bg-[var(--color-piggy-super-green)] animate-pulse" />
                <span className="text-xs font-bold tracking-wider text-[var(--color-piggy-super-green)] uppercase">Live Feed</span>
            </div>

            <div className="flex-1 overflow-hidden relative">
                <motion.div
                    className="flex items-center gap-8 px-4 whitespace-nowrap"
                    animate={{ x: [0, -1000] }}
                    transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
                >
                    {[...activities, ...activities, ...activities].map((activity, i) => (
                        <div key={`${activity.id}-${i}`} className="flex items-center gap-2 text-sm text-gray-300">
                            <Avatar className="h-5 w-5 border border-white/10">
                                <AvatarImage src={activity.image} />
                                <AvatarFallback className="text-[10px] bg-[var(--color-piggy-deep-pink)]">{activity.user[0]}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-white">{activity.user}</span>
                            <span className="text-gray-400">{activity.action}</span>
                            <span className="text-xs text-gray-500">• {activity.time}</span>
                        </div>
                    ))}
                </motion.div>

                {/* Gradient masks for smooth fade */}
                <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-black/40 to-transparent pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-black/40 to-transparent pointer-events-none" />
            </div>
        </div>
    );
}
