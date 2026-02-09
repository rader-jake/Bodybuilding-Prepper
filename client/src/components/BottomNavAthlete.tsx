import { Link, useLocation } from "wouter";
import { Home, CalendarDays, PlusCircle, MessageSquare, User } from "lucide-react";
import { cn } from "@/lib/utils";

export default function BottomNavAthlete() {
    const [location] = useLocation();

    const tabs = [
        {
            label: "Home",
            icon: Home,
            href: "/athlete/dashboard",
            active: (path: string) => path === "/athlete/dashboard",
        },
        {
            label: "Schedule",
            icon: CalendarDays,
            href: "/athlete/calendar",
            active: (path: string) => path === "/athlete/calendar",
        },
        {
            label: "Check-In",
            icon: PlusCircle,
            href: "/athlete/check-in",
            active: (path: string) => path === "/athlete/check-in",
        },
        {
            label: "Coach",
            icon: MessageSquare,
            href: "/athlete/messages",
            active: (path: string) => path.startsWith("/athlete/messages"),
        },
        {
            label: "Profile",
            icon: User,
            href: "/settings/profile",
            active: (path: string) => path === "/settings/profile",
        },
    ];

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-lg border-t border-border/50 pb-[env(safe-area-inset-bottom)]">
            <div className="flex justify-around items-center h-16">
                {tabs.map((tab) => {
                    const isActive = tab.active(location);
                    return (
                        <Link key={tab.label} href={tab.href}>
                            <a
                                className={cn(
                                    "flex flex-col items-center justify-center w-full h-full space-y-1",
                                    isActive
                                        ? "text-primary dark:text-primary"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <tab.icon
                                    className={cn(
                                        "w-6 h-6 transition-all duration-200",
                                        isActive && "scale-110",
                                        tab.label === "Check-In" && "w-7 h-7"
                                    )}
                                />
                                <span className="text-[10px] font-medium tracking-wide">
                                    {tab.label}
                                </span>
                            </a>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
