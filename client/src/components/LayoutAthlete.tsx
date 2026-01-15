import React, { useMemo, useState } from "react";
import { Link } from "wouter";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Home, FileText, Clock, Activity, Settings, Layout, Menu, X, LogOut, HeartPulse, CalendarDays } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function LayoutAthlete({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const avatarFallback = useMemo(
    () => user?.displayName?.[0] || user?.username?.[0] || "U",
    [user?.displayName, user?.username]
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="md:flex">
        <aside className="hidden md:flex md:flex-col w-72 h-screen sticky top-0 p-4 border-r border-border bg-card">
          <div className="flex items-center gap-3 px-2 py-3">
            <Avatar>
              {user?.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="Athlete avatar" /> : null}
              <AvatarFallback>{avatarFallback}</AvatarFallback>
            </Avatar>
            <div>
              <div className="text-sm font-bold">{user?.displayName || user?.username || "Athlete"}</div>
              <div className="text-xs text-muted-foreground">View profile</div>
            </div>
          </div>

          <nav className="mt-6 flex-1">
            <ul className="space-y-1">
              <li>
                <Link href="/athlete/dashboard" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-primary/5">
                  <Home className="w-5 h-5 text-primary" />
                  <span>Dashboard</span>
                </Link>
              </li>
              <li>
                <Link href="/athlete/check-in" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-primary/5">
                  <FileText className="w-5 h-5 text-primary" />
                  <span>Check-In</span>
                </Link>
              </li>
              <li>
                <Link href="/athlete/history" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-primary/5">
                  <Clock className="w-5 h-5 text-primary" />
                  <span>History</span>
                </Link>
              </li>
              <li>
                <Link href="/athlete/workout-plan" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-primary/5">
                  <Activity className="w-5 h-5 text-primary" />
                  <span>Workout Plan</span>
                </Link>
              </li>
              <li>
                <Link href="/athlete/meal-plan" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-primary/5">
                  <Layout className="w-5 h-5 text-primary" />
                  <span>Meal Plan</span>
                </Link>
              </li>
              <li>
                <Link href="/athlete/calendar" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-primary/5">
                  <CalendarDays className="w-5 h-5 text-primary" />
                  <span>Show Calendar</span>
                </Link>
              </li>
              <li>
                <Link href="/athlete/protocols-health" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-primary/5">
                  <HeartPulse className="w-5 h-5 text-primary" />
                  <span>Protocols & Health</span>
                </Link>
              </li>
            </ul>
          </nav>

          <div className="mt-auto px-3 py-4">
            <Link href="/settings/profile" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-primary/5">
              <Settings className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm">Profile</span>
            </Link>
          </div>
        </aside>

        <div className="flex-1">
          <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  className="md:hidden inline-flex items-center justify-center rounded-md border border-border/60 p-2 text-muted-foreground"
                  aria-expanded={isMobileMenuOpen}
                  aria-controls="athlete-mobile-menu"
                  aria-label="Toggle navigation menu"
                  onClick={() => setIsMobileMenuOpen((open) => !open)}
                >
                  {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
                <div className="text-xl sm:text-2xl font-display font-bold tracking-tight text-primary truncate">Prep Coach</div>
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
              <nav id="athlete-mobile-menu" className="md:hidden fixed left-0 top-0 z-40 h-screen w-screen bg-background">
                <div className="h-full w-full px-4 py-6 flex flex-col">
                  <div className="flex items-center justify-between mb-6">
                    <div className="text-xl font-display font-bold text-primary">Prep Coach</div>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-md border border-border/60 p-2 text-muted-foreground"
                      onClick={() => setIsMobileMenuOpen(false)}
                      aria-label="Close navigation menu"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
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

          <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
