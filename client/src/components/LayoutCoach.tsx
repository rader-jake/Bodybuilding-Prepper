import React, { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Home, CalendarDays, Users, MessageSquare, Settings, Menu, X, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import BottomNavCoach from "./BottomNavCoach";

export default function LayoutCoach({ children, title = "Coach Dashboard" }: { children: React.ReactNode; title?: string }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { user, logout } = useAuth();
    const [location] = useLocation();

    const avatarFallback = useMemo(
        () => user?.displayName?.[0] || user?.username?.[0] || "C",
        [user?.displayName, user?.username]
    );

    const navItems = [
        { label: "Dashboard", href: "/dashboard", icon: Home, match: (path: string) => path === "/dashboard" },
        { label: "Schedule", href: "/dashboard/checkins", icon: CalendarDays, match: (path: string) => path.startsWith("/dashboard/checkins") },
        // Clients is essentially the dashboard/roster, but could be separate.
        // For now I won't duplicate it in the sidebar to avoid confusion, 
        // or I'll point it to /dashboard?view=clients if I implemented that.
        // I'll stick to the core tabs.
        { label: "Messages", href: "/dashboard/messages", icon: MessageSquare, match: (path: string) => path.startsWith("/dashboard/messages") },
    ];

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="md:flex">
                {/* Desktop Sidebar */}
                <aside className="hidden md:flex md:flex-col w-72 h-screen sticky top-0 p-4 border-r border-border bg-card">
                    <div className="flex items-center gap-3 px-2 py-3">
                        <Avatar>
                            {user?.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="Coach avatar" /> : null}
                            <AvatarFallback>{avatarFallback}</AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="text-sm font-bold">{user?.displayName || user?.username || "Coach"}</div>
                            <div className="text-xs text-muted-foreground">View profile</div>
                        </div>
                    </div>

                    <nav className="mt-6 flex-1">
                        <ul className="space-y-1">
                            {navItems.map((item) => (
                                <li key={item.label}>
                                    <Link href={item.href}>
                                        <a className={`flex items-center gap-3 px-3 py-2 rounded hover:bg-primary/5 ${item.match(location) ? 'bg-primary/10 text-primary font-bold' : ''}`}>
                                            <item.icon className="w-5 h-5" />
                                            <span>{item.label}</span>
                                        </a>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    <div className="mt-auto px-3 py-4 space-y-2">
                        <Link href="/settings/profile">
                            <a className="flex items-center gap-3 px-3 py-2 rounded hover:bg-primary/5">
                                <Settings className="w-5 h-5 text-muted-foreground" />
                                <span className="text-sm">Profile</span>
                            </a>
                        </Link>
                        <button
                            onClick={() => logout()}
                            className="flex w-full items-center gap-3 px-3 py-2 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors text-left"
                        >
                            <LogOut className="w-5 h-5" />
                            <span className="text-sm">Log out</span>
                        </button>
                    </div>
                </aside>

                <div className="flex-1 min-w-0">
                    {/* Mobile Header */}
                    <header className="md:hidden sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/50">
                        <div className="px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="text-xl font-display font-bold tracking-tight text-primary">{title}</div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                    {user?.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="Coach avatar" /> : null}
                                    <AvatarFallback>{avatarFallback}</AvatarFallback>
                                </Avatar>
                            </div>
                        </div>
                    </header>

                    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 mb-16 md:mb-0">
                        {children}
                    </main>
                </div>
            </div>
            <BottomNavCoach />
        </div>
    );
}
