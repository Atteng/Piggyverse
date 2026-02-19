
"use client";

import { Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

const categories = ["All Games", "Popular", "New", "Card Games", "Shooters", "Strategy"];

export function LibraryFilters() {
    return (
        <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between">
            {/* Category Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto no-scrollbar">
                {categories.map((category, i) => (
                    <button
                        key={category}
                        className={`px-4 py-2 rounded-full text-piggy-body font-medium whitespace-nowrap transition-all ${i === 0
                            ? "bg-[var(--color-piggy-deep-pink)] text-white shadow-lg shadow-[var(--color-piggy-deep-pink)]/20"
                            : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/5"
                            }`}
                    >
                        {category}
                    </button>
                ))}
            </div>

            {/* Search & Sort */}
            <div className="flex gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search library..."
                        className="w-full bg-black/20 border border-white/10 rounded-full py-2 pl-9 pr-4 text-piggy-body text-white focus:outline-none focus:border-[var(--color-piggy-deep-pink)] transition-colors"
                    />
                </div>
                <Button variant="outline" size="icon" className="shrink-0 border-white/10 text-gray-400 hover:text-white hover:bg-white/5 rounded-full">
                    <Filter className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
