import React, { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Home, CalendarDays, Users, MessageSquare, Settings, Menu, X, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import BottomNavCoach from "./BottomNavCoach";

import { OnboardingModal } from "@/components/ui/OnboardingModal";

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
        <div className="h-full bg-background text-foreground">
            <OnboardingModal />
            <div className="h-full flex flex-col md:flex-row bg-background text-foreground overflow-hidden">
                <aside className="hidden md:flex md:flex-col w-72 h-full border-r border-white/[0.05] bg-ml-surface p-6">
                    <div className="mb-10 px-2">
                        <h1 className="text-3xl font-display tracking-tight leading-none">
                            <span className="font-bold text-foreground">META</span>
                            <span className="font-light text-primary">LIFTS</span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-4 px-3 py-4 mb-8 bg-white/[0.02] rounded-2xl border border-white/5 ring-1 ring-white/5 shadow-xl">
                        <Avatar className="h-10 w-10 border border-white/10">
                            {user?.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="Coach avatar" /> : null}
                            <AvatarFallback className="bg-ml-elevated text-ml-text-dimmed font-bold">{avatarFallback}</AvatarFallback>
                        </Avatar>
                        <div className="overflow-hidden">
                            <div className="text-sm font-bold truncate tracking-tight">{user?.displayName || user?.username || "Coach"}</div>
                            <div className="text-[10px] uppercase font-bold tracking-widest text-primary opacity-60">Coach Access</div>
                        </div>
                    </div>

                    <nav className="flex-1">
                        <ul className="space-y-2">
                            {navItems.map((item) => (
                                <li key={item.label}>
                                    <Link href={item.href}>
                                        <a className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group ${item.match(location) ? 'bg-primary/10 text-primary border border-primary/20 shadow-lg shadow-primary/5' : 'text-ml-text-dimmed hover:text-foreground hover:bg-white/5'}`}>
                                            <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${item.match(location) ? 'text-primary' : 'text-ml-text-dimmed group-hover:text-foreground'}`} />
                                            <span className="text-sm font-bold uppercase tracking-widest">{item.label}</span>
                                        </a>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    <div className="mt-auto space-y-2 pt-6 border-t border-white/5">
                        <Link href="/settings/profile">
                            <a className="flex items-center gap-4 px-4 py-3 rounded-xl text-ml-text-dimmed hover:text-foreground hover:bg-white/5 transition-all">
                                <Settings className="w-5 h-5" />
                                <span className="text-sm font-bold uppercase tracking-widest">Profile</span>
                            </a>
                        </Link>
                        <button
                            onClick={() => logout()}
                            className="flex w-full items-center gap-4 px-4 py-3 rounded-xl text-ml-text-dimmed hover:text-destructive hover:bg-destructive/10 transition-all text-left"
                        >
                            <LogOut className="w-5 h-5" />
                            <span className="text-sm font-bold uppercase tracking-widest">Log out</span>
                        </button>
                    </div>
                </aside>

                <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
                    {/* Mobile Header */}
                    <header className="md:hidden z-20 bg-background/80 backdrop-blur-md border-b border-border/50 shrink-0">
                        <div className="px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="text-xl font-display font-bold tracking-tight text-primary">{title}</div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => logout()}
                                    className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
                                >
                                    Log out
                                </button>
                                <Avatar className="h-8 w-8">
                                    {user?.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="Coach avatar" /> : null}
                                    <AvatarFallback>{avatarFallback}</AvatarFallback>
                                </Avatar>
                            </div>
                        </div>
                    </header>

                    <main className="flex-1 overflow-y-auto scroll-y w-full">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 mb-24 md:mb-0">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
            <BottomNavCoach />
        </div>
    );
}
