import { Link, useLocation } from "wouter";
import { Home, CalendarDays, Users, MessageSquare, User, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";

export default function BottomNavCoach() {
    const [location] = useLocation();

    const tabs = [
        {
            label: "Home",
            icon: Home,
            href: "/dashboard",
            active: (path: string) => path === "/dashboard" && !window.location.search,
        },
        {
            label: "Schedule",
            icon: CalendarDays,
            href: "/dashboard/checkins",
            active: (path: string) => path.startsWith("/dashboard/checkins"),
        },
        {
            label: "Clients",
            icon: Users,
            href: "/dashboard",
            active: (path: string) => path === "/dashboard", // Currently same as home
        },
        {
            label: "Messages",
            icon: MessageSquare,
            href: "/dashboard/messages",
            active: (path: string) => path.startsWith("/dashboard/messages"),
        },
        {
            label: "Profile",
            icon: User,
            href: "/settings/profile",
            active: (path: string) => path === "/settings/profile",
        },
    ];

    // Remove Clients tab if it's redundant with Home for now, or keep it.
    // The user explicitly asked for it. 
    // Let's filter out 'Clients' if it's identical to Home for now to avoid confusion, 
    // OR keep it but maybe it feels weird to share the state.
    // I will keep it as requested. I'll modify the active check slightly.

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t border-border/50 pb-[env(safe-area-inset-bottom)]">
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
                                        isActive && "scale-110"
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
