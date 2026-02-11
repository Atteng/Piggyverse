"use client";

import { motion } from "framer-motion";

interface NotificationFiltersProps {
    filter: string;
    onFilterChange: (filter: string) => void;
}

const filters = [
    { id: "all", label: "All Activity" },
    { id: "tournament", label: "Tournaments" },
    { id: "earning", label: "Earnings" },
    { id: "system", label: "System" },
];

export function NotificationFilters({ filter, onFilterChange }: NotificationFiltersProps) {
    return (
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl backdrop-blur-sm border border-white/10 w-full sm:w-auto overflow-x-auto">
            {filters.map((item) => (
                <button
                    key={item.id}
                    onClick={() => onFilterChange(item.id)}
                    className={`relative px-4 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap z-10 ${filter === item.id ? "text-white" : "text-gray-400 hover:text-white"
                        }`}
                >
                    {filter === item.id && (
                        <motion.div
                            layoutId="activeFilter"
                            className="absolute inset-0 bg-white/10 rounded-lg -z-10 border border-white/10"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                    )}
                    {item.label}
                </button>
            ))}
        </div>
    );
}
