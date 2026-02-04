import React from "react";
import { cn } from "@/lib/utils";

interface SafeAreaProps {
    children: React.ReactNode;
    className?: string;
    top?: boolean;
    bottom?: boolean;
    left?: boolean;
    right?: boolean;
    as?: React.ElementType;
}

export function SafeArea({
    children,
    className,
    top = true,
    bottom = true,
    left = true,
    right = true,
    as: Component = "div",
}: SafeAreaProps) {
    return (
        <Component
            className={cn(
                "h-dvh w-full overflow-hidden flex flex-col",
                top && "pt-[env(safe-area-inset-top)]",
                bottom && "pb-[env(safe-area-inset-bottom)]",
                left && "pl-[env(safe-area-inset-left)]",
                right && "pr-[env(safe-area-inset-right)]",
                className
            )}
        >
            <div className="flex-1 w-full h-full overflow-hidden flex flex-col relative">
                {children}
            </div>
        </Component>
    );
}

export default SafeArea;
