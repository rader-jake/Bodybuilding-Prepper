import React, { useMemo, useState } from "react";
import { Link } from "wouter";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Home, FileText, Clock, Activity, Settings, Layout, Menu, X, LogOut, HeartPulse, CalendarDays, MessageSquare, Zap } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import BottomNavAthlete from "./BottomNavAthlete";

import { OnboardingModal } from "@/components/ui/OnboardingModal";

export default function LayoutAthlete({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const avatarFallback = useMemo(
    () => user?.displayName?.[0] || user?.username?.[0] || "U",
    [user?.displayName, user?.username]
  );

  return (
    <div className="h-full flex flex-col md:flex-row bg-background text-foreground overflow-hidden">
      <OnboardingModal />
      <aside className="hidden md:flex md:flex-col w-72 h-full border-r border-white/[0.05] bg-ml-surface p-6">
        <div className="mb-10 px-2">
          <h1 className="text-3xl font-display tracking-tight leading-none">
            <span className="font-bold text-foreground">META</span>
            <span className="font-light text-primary">LIFTS</span>
          </h1>
        </div>

        <div className="flex items-center gap-4 px-3 py-4 mb-8 bg-white/[0.02] rounded-2xl border border-white/5 ring-1 ring-white/5 shadow-xl">
          <Avatar className="h-10 w-10 border border-white/10">
            {user?.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="Athlete avatar" /> : null}
            <AvatarFallback className="bg-ml-elevated text-ml-text-dimmed font-bold text-sm tracking-tight">{avatarFallback}</AvatarFallback>
          </Avatar>
          <div className="overflow-hidden">
            <div className="text-sm font-bold truncate tracking-tight leading-none mb-1">{user?.displayName || user?.username || "Athlete"}</div>
            <div className="text-[10px] uppercase font-bold tracking-widest text-primary opacity-60">Athlete View</div>
          </div>
        </div>

        <nav className="flex-1">
          <ul className="space-y-2">
            {[
              { href: "/athlete/dashboard", label: "Dashboard", icon: Home },
              { href: "/athlete/check-in", label: "Check-In", icon: FileText },
              { href: "/athlete/history", label: "History", icon: Clock },
              { href: "/athlete/workout-plan", label: "Workout Plan", icon: Activity },
              { href: "/athlete/meal-plan", label: "Meal Plan", icon: Layout },
              { href: "/athlete/calendar", label: "Show Calendar", icon: CalendarDays },
              { href: "/athlete/messages", label: "Messages", icon: MessageSquare },
              { href: "/athlete/protocols-health", label: "Protocols", icon: HeartPulse },
            ].map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group hover:bg-white/5 text-ml-text-dimmed hover:text-foreground"
                >
                  <item.icon className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.15em]">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-auto space-y-2 pt-6 border-t border-white/5">
          <Link href="/settings/profile" className="flex items-center gap-4 px-4 py-3 rounded-xl text-ml-text-dimmed hover:text-foreground hover:bg-white/5 transition-all">
            <Settings className="w-5 h-5" />
            <span className="text-[11px] font-bold uppercase tracking-[0.15em]">Profile</span>
          </Link>
          <button
            onClick={() => logout()}
            className="flex w-full items-center gap-4 px-4 py-3 rounded-xl text-ml-text-dimmed hover:text-destructive hover:bg-destructive/10 transition-all text-left"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-[11px] font-bold uppercase tracking-[0.15em]">Log out</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="z-20 bg-ml-bg/80 backdrop-blur-xl border-b border-white/5 shrink-0 px-4">
          <div className="max-w-6xl mx-auto py-4 flex items-center justify-between">
            <div className="flex items-center gap-4 min-w-0">
              <button
                type="button"
                className="md:hidden inline-flex items-center justify-center rounded-xl bg-white/5 p-2 text-primary"
                aria-expanded={isMobileMenuOpen}
                aria-controls="athlete-mobile-menu"
                aria-label="Toggle navigation menu"
                onClick={() => setIsMobileMenuOpen((open) => !open)}
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <div className="text-2xl font-display font-bold tracking-tight text-foreground truncate">
                <span className="text-primary">META</span>LIFTS
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => logout()}
                className="hidden sm:inline-flex text-sm text-muted-foreground hover:text-foreground"
              >
                Log out
              </button>
              <Avatar>
                {user?.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="Athlete avatar" /> : null}
                <AvatarFallback>{avatarFallback}</AvatarFallback>
              </Avatar>
            </div>
          </div>
          {isMobileMenuOpen && (
            <nav id="athlete-mobile-menu" className="md:hidden fixed left-0 top-[calc(57px+env(safe-area-inset-top))] z-50 w-screen h-[calc(100dvh-57px-env(safe-area-inset-top))] bg-background border-t border-border/50">
              <div className="h-full w-full px-4 py-6 flex flex-col overflow-y-auto pb-[calc(80px+env(safe-area-inset-bottom))]">
                <ul className="grid gap-2 flex-1">
                  <li>
                    <Link
                      href="/athlete/dashboard"
                      className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-primary/5"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Home className="w-5 h-5 text-primary" />
                      <span>Dashboard</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/athlete/check-in"
                      className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-primary/5"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <FileText className="w-5 h-5 text-primary" />
                      <span>Check-In</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/athlete/history"
                      className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-primary/5"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Clock className="w-5 h-5 text-primary" />
                      <span>History</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/athlete/workout-plan"
                      className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-primary/5"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Activity className="w-5 h-5 text-primary" />
                      <span>Workout Plan</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/athlete/meal-plan"
                      className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-primary/5"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Layout className="w-5 h-5 text-primary" />
                      <span>Meal Plan</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/athlete/calendar"
                      className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-primary/5"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <CalendarDays className="w-5 h-5 text-primary" />
                      <span>Show Calendar</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/athlete/protocols-health"
                      className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-primary/5"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <HeartPulse className="w-5 h-5 text-primary" />
                      <span>Protocols & Health</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/settings/profile"
                      className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-primary/5"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Settings className="w-5 h-5 text-muted-foreground" />
                      <span>Profile</span>
                    </Link>
                  </li>
                  <li>
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 px-3 py-2 rounded-md hover:bg-primary/5 text-left"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        logout();
                      }}
                    >
                      <LogOut className="w-5 h-5 text-muted-foreground" />
                      <span>Log out</span>
                    </button>
                  </li>
                </ul>
              </div>
            </nav>
          )}
        </header>

        <main className="flex-1 overflow-y-auto scroll-y w-full">
          {user?.paymentStatus === "trial" && (
            <div className="bg-primary/10 border-b border-primary/20 px-6 py-3">
              <div className="max-w-6xl mx-auto flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4 text-primary" />
                </div>
                <p className="text-sm font-medium">
                  {(user as any)?.coachBillingMode === "platform"
                    ? "Your coach uses MetaLifts to manage billing automatically. Add a payment method to continue uninterrupted."
                    : "Your coach handles billing outside MetaLifts. Please follow your coach’s instructions for payment."}
                </p>
              </div>
            </div>
          )}
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 mb-24 md:mb-0">
            {children}
          </div>
        </main>
        <BottomNavAthlete />
      </div>
    </div>
  );
}
