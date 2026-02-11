
"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { scaleOnHover, fadeIn } from "@/lib/animations/variants";
import { cn } from "@/lib/utils";

interface AnimatedCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
    children: React.ReactNode;
    delay?: number;
    className?: string;
}

export function AnimatedCard({ children, delay = 0, className, ...props }: AnimatedCardProps) {
    return (
        <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            whileTap="tap"
            custom={delay}
            className={cn(
                "relative overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-md transition-colors hover:bg-white/10",
                className
            )}
            {...props}
        >
            <motion.div variants={scaleOnHover} className="h-full w-full">
                {children}
            </motion.div>
        </motion.div>
    );
}
