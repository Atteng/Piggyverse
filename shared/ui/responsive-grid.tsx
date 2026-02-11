
import { cn } from "@/lib/utils";

interface ResponsiveGridProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    columns?: {
        default: number;
        sm?: number;
        md?: number;
        lg?: number;
        xl?: number;
    };
}

export function ResponsiveGrid({
    children,
    columns = { default: 1, sm: 2, md: 3, lg: 4, xl: 4 },
    className,
    ...props
}: ResponsiveGridProps) {
    const gridColsClass = cn(
        "grid gap-4",
        `grid-cols-${columns.default}`,
        columns.sm && `sm:grid-cols-${columns.sm}`,
        columns.md && `md:grid-cols-${columns.md}`,
        columns.lg && `lg:grid-cols-${columns.lg}`,
        columns.xl && `xl:grid-cols-${columns.xl}`,
        className
    );

    return (
        <div className={gridColsClass} {...props}>
            {children}
        </div>
    );
}
