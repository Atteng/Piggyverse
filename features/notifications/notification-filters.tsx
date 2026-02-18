"use client";

import { motion } from "framer-motion";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface NotificationFiltersProps {
    filter: string;
    onFilterChange: (filter: string) => void;
}

const filters = [
    { id: "all", label: "All" },
    { id: "tournament", label: "Games" },
    { id: "earning", label: "Prize" },
    { id: "system", label: "System" },
    { id: "social", label: "Social" },
];

export function NotificationFilters({ filter, onFilterChange }: NotificationFiltersProps) {
    return (
        <>
            {/* Mobile: Dropdown */}
            <div className="md:hidden w-full">
                <Select value={filter} onValueChange={onFilterChange}>
                    <SelectTrigger className="w-full bg-black/80 dark:bg-black/80 backdrop-blur-md border-white/10 text-white h-12 rounded-full shadow-2xl font-bold uppercase tracking-widest text-xs focus:ring-0 focus:ring-offset-0 ring-offset-0 focus:ring-transparent transition-all">
                        <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent className="bg-black/90 backdrop-blur-3xl border-white/10 text-white rounded-2xl shadow-2xl z-50">
                        {filters.map((item) => (
                            <SelectItem
                                key={item.id}
                                value={item.id}
                                className="focus:bg-white/10 focus:text-white cursor-pointer py-3 font-mono text-xs uppercase tracking-wider text-white hover:text-white hover:bg-white/5"
                            >
                                {item.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Desktop: Tabs */}
            <div className="hidden md:flex items-center gap-1.5 bg-black/40 p-1.5 rounded-2xl border border-white/5 w-full min-w-0 overflow-x-auto custom-scrollbar shadow-inner no-scrollbar">
                {filters.map((item) => (
                    <button
                        key={item.id} // Added key here (was missing in original replacement context if I replaced map content only, but I'm replacing whole component)
                        onClick={() => onFilterChange(item.id)}
                        className={cn(
                            "relative px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap z-10 uppercase tracking-widest",
                            filter === item.id
                                ? "text-white"
                                : "text-white/40 hover:text-white/60 hover:bg-white/5"
                        )}
                    >
                        {filter === item.id && (
                            <motion.div
                                layoutId="activeFilter"
                                className="absolute inset-0 bg-[var(--color-piggy-deep-pink)] rounded-xl -z-10 shadow-lg"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        {item.label}
                    </button>
                ))}
            </div>
        </>
    );
}
