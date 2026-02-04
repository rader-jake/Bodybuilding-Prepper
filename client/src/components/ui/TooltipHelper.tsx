import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { preferences } from "@/lib/preferences";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface TooltipHelperProps {
    preferenceKey: string;
    children: React.ReactNode;
    content: string;
    side?: "top" | "bottom" | "left" | "right";
}

export function TooltipHelper({ preferenceKey, children, content, side = "top" }: TooltipHelperProps) {
    const [open, setOpen] = useState(() => {
        return !preferences.get(preferenceKey);
    });

    if (!open) return <>{children}</>;

    const handleDismiss = () => {
        preferences.set(preferenceKey, true);
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={handleDismiss}>
            <PopoverTrigger asChild>
                {children}
            </PopoverTrigger>
            <PopoverContent
                side={side}
                className="w-64 p-3 bg-primary text-primary-foreground border-none shadow-[0_0_20px_rgba(var(--primary),0.4)] relative"
            >
                <div className="pr-6 text-xs font-medium leading-relaxed">
                    {content}
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
                    className="absolute top-1 right-1 p-1 hover:bg-black/10 rounded-full"
                >
                    <X className="w-3 h-3" />
                </button>
            </PopoverContent>
        </Popover>
    );
}
