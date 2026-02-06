import { useAuth } from "@/hooks/use-auth";
import { useAthletes } from "@/hooks/use-athletes";
import { useCheckins } from "@/hooks/use-checkins";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus, Users, Search, AlertCircle, CheckCircle2, ChevronRight, LogOut, CalendarDays, CreditCard } from "lucide-react";
import { useState } from "react";
import { format, endOfWeek, isWithinInterval, startOfWeek } from "date-fns";
import { Redirect, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { api, type TrainingCompletion } from "@shared/routes";
import LayoutCoach from "@/components/LayoutCoach";
import { apiFetch } from "@/lib/apiFetch";
import { EmptyState } from "@/components/ui/EmptyState";
import { TooltipHelper } from "@/components/ui/TooltipHelper";
import { PREFERENCES_KEYS } from "@/lib/preferences";
import { getDashboardForUser } from "@/lib/templates";

export default function CoachDashboard() {
  const { user, logout } = useAuth();
  const { athletes, createAthlete } = useAthletes();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const todayKey = format(new Date(), "yyyy-MM-dd");

  const { data: completions } = useQuery({
    queryKey: [api.trainingCompletions.list.path, todayKey],
    queryFn: async () => {
      const url = `${api.trainingCompletions.list.path}?dateKey=${todayKey}`;
      return await apiFetch<TrainingCompletion[]>(url);
    },
    enabled: !!user,
  });

  const { data: coachCheckins } = useQuery({
    queryKey: [api.checkins.queue.path],
    queryFn: async () => {
      return await apiFetch<Array<{ athleteId: number; date: string }>>(api.checkins.queue.path);
    },
    enabled: !!user,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<'all' | 'needs-attention' | 'on-track'>('all');
  const [newAthleteName, setNewAthleteName] = useState("");
  const [newAthletePass, setNewAthletePass] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Dynamic Dashboard Logic
  const dashboardConfig = getDashboardForUser(user || null);

  if (!user || user.role !== 'coach') return <Redirect to="/" />;

  const handleCreateAthlete = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Enforce: cannot create athlete until coachIndustry is set
    if (!user?.coachIndustry) {
      toast({
        variant: "destructive",
        title: "Setup Required",
        description: "Please complete industry setup first.",
      });
      return;
    }

    createAthlete.mutate({
      username: newAthleteName,
      password: newAthletePass,
      role: 'athlete',
      coachId: user.id,
      sport: user.coachIndustry, // Athlete inherits coach's industry
    }, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setNewAthleteName("");
        setNewAthletePass("");
      }
    });
  };

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

  const athletesWithCheckin = new Set(
    (coachCheckins || []).filter((checkin) =>
      isWithinInterval(new Date(checkin.date), { start: weekStart, end: weekEnd })
    ).map((checkin) => checkin.athleteId)
  );

  const filteredAthletes = athletes?.filter(athlete => {
    const matchesSearch = athlete.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      athlete.displayName?.toLowerCase().includes(searchQuery.toLowerCase());

    const hasCheckin = athletesWithCheckin.has(athlete.id);
    if (filter === 'needs-attention') return matchesSearch && !hasCheckin;
    if (filter === 'on-track') return matchesSearch && hasCheckin;
    return matchesSearch;
  });

  const getMetricValue = (key: string) => {
    switch (key) {
      case 'pending_checkins':
        return Math.max((athletes?.length || 0) - athletesWithCheckin.size, 0);
      case 'compliance_pct':
        return athletes?.length ? Math.round((athletesWithCheckin.size / athletes.length) * 100) + '%' : '0%';
      case 'total_roster':
        return athletes?.length || 0;
      case 'upcoming_events':
        return athletes?.filter(a => a.nextShowDate && new Date(a.nextShowDate) > new Date()).length || 0;
      case 'pr_count':
        return 0; // Stub
      case 'injury_flags':
        return 0; // Stub
      case 'checkins_due':
        return Math.max((athletes?.length || 0) - athletesWithCheckin.size, 0);
      default:
        return 0;
    }
  };

  const getMetricLabel = (key: string) => {
    switch (key) {
      case 'pending_checkins': return 'Pending Check-ins';
      case 'compliance_pct': return 'Checked In';
      case 'upcoming_events': return 'Upcoming Events';
      case 'pr_count': return 'New PRs';
      default: return 'Count';
    }
  };

  return (
    <LayoutCoach>
      <div className="space-y-8">

        {!athletes || athletes.length === 0 ? (
          <div className="glass-panel rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl mb-12 animate-in fade-in slide-in-from-top-4 duration-1000">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-2xl shadow-xl rotate-3">1</div>
              <div>
                <h3 className="text-xl font-display font-bold text-primary">Let's build your roster</h3>
                <p className="text-muted-foreground max-w-md">Your dashboard is empty. Add your first athlete below to start tracking their progress and reviewing check-ins.</p>
              </div>
            </div>
            <Button onClick={() => setIsDialogOpen(true)} className="btn-primary w-full md:w-auto h-14 px-8 group">
              Get Started <Plus className="w-5 h-5 ml-2 group-hover:rotate-90 transition-transform" />
            </Button>
          </div>
        ) : null}

        <div className="hidden md:flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">{dashboardConfig.welcomeMessage}</h1>
          <div className="text-sm text-muted-foreground font-medium bg-secondary/20 px-3 py-1 rounded-full uppercase tracking-wider">
            Sport: {dashboardConfig.sportType}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card-premium h-full flex flex-col justify-between group">
            <p className="label-caps">Total Roster</p>
            <div className="flex items-end gap-3 mt-4">
              <p className="text-5xl font-display font-bold leading-none tracking-tighter transition-all group-hover:text-primary">{athletes?.length || 0}</p>
              <p className="text-sm text-ml-text-dimmed mb-1 font-medium">ATHLETES</p>
            </div>
          </div>

          {dashboardConfig.tiles.map(tile => (
            <div key={tile.id} className="card-premium h-full flex flex-col justify-between group">
              <div className="flex items-center justify-between">
                <p className="label-caps">{tile.title}</p>
                <div className={`p-2 rounded-xl bg-opacity-10 ${tile.color ? tile.color.replace('text-', 'bg-') : 'bg-muted'} group-hover:scale-110 transition-transform`}>
                  <tile.icon className={`w-4 h-4 ${tile.color || 'text-muted-foreground'}`} />
                </div>
              </div>
              <div className="flex items-end gap-3 mt-4">
                <p className={`text-5xl font-display font-bold leading-none tracking-tighter ${tile.color || 'text-foreground'}`}>
                  {getMetricValue(tile.metricKey)}
                </p>
                <p className={`text-sm ${tile.color ? tile.color + '/60' : 'text-ml-text-dimmed'} mb-1 font-medium`}>
                  {getMetricLabel(tile.metricKey).split(' ')[0].toUpperCase()}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Roster Section */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              Active Roster
            </h2>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="flex bg-secondary/50 p-1 rounded-lg border border-border/50">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filter === 'all' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('needs-attention')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filter === 'needs-attention' ? 'bg-background text-orange-500 shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setFilter('on-track')}
                  className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${filter === 'on-track' ? 'bg-background text-emerald-500 shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  On Track
                </button>
              </div>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="btn-primary h-12 px-6 ml-auto md:ml-0">
                    <Plus className="w-5 h-5 mr-2" />
                    New Athlete
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border">
                  <DialogHeader>
                    <DialogTitle className="font-display uppercase tracking-wide">Add New Athlete</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateAthlete} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-muted-foreground">Athlete Name / Nickname</label>
                      <Input value={newAthleteName} onChange={e => setNewAthleteName(e.target.value)} className="bg-secondary/50" placeholder="e.g. Big Ron" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-muted-foreground">Initial Password</label>
                      <Input type="password" value={newAthletePass} onChange={e => setNewAthletePass(e.target.value)} className="bg-secondary/50" />
                    </div>
                    <Button type="submit" className="w-full font-bold uppercase tracking-wider bg-primary mt-2">Create Athlete Profile</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search athletes by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 bg-secondary/10 border-border/50 focus:bg-secondary/20 text-lg transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAthletes?.map((athlete) => (
              <AthleteCard
                key={athlete.id}
                athlete={athlete}
                hasCheckedIn={athletesWithCheckin.has(athlete.id)}
                onOpen={() => setLocation(`/dashboard/athletes/${athlete.id}`)}
                completion={completions?.find((item) => item.athleteId === athlete.id)}
              />
            ))}
            {filteredAthletes?.length === 0 && (
              <div className="col-span-full">
                <EmptyState
                  icon={Users}
                  title="No Athletes Found"
                  description={searchQuery ? "Try adjusting your search filters." : "You haven't added any athletes yet."}
                  actionLabel={!searchQuery ? "Add Your First Athlete" : undefined}
                  onAction={!searchQuery ? () => setIsDialogOpen(true) : undefined}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </LayoutCoach>
  );
}

function AthleteCard({
  athlete,
  onOpen,
  completion,
  hasCheckedIn,
}: {
  athlete: any;
  onOpen: () => void;
  completion?: TrainingCompletion;
  hasCheckedIn: boolean;
}) {
  const { checkins } = useCheckins(athlete.id);
  const latestCheckin = checkins?.[0];

  return (
    <div
      className={`card-premium relative overflow-hidden flex flex-col h-full ring-1 ring-white/[0.05] cursor-pointer group ${!hasCheckedIn ? 'before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-orange-500' : 'before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-primary'}`}
      onClick={onOpen}
    >
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <Avatar className="w-14 h-14 rounded-2xl border border-white/10 shadow-2xl transition-all duration-500 group-hover:scale-105 group-hover:rotate-3">
            {athlete.avatarUrl ? <AvatarImage src={athlete.avatarUrl} alt={`${athlete.username} avatar`} /> : null}
            <AvatarFallback className="font-display font-bold text-xl bg-ml-elevated text-ml-text-dimmed group-hover:text-primary transition-colors">
              {athlete.username.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-display font-bold text-xl tracking-tight leading-none group-hover:text-primary transition-colors">
              {athlete.displayName || athlete.username}
            </h3>
            <p className="label-caps mt-2 opacity-60">
              {athlete.currentPhase || 'Off-season'}
            </p>
          </div>
        </div>
        <div className="shrink-0 space-y-2">
          <div>
            {!hasCheckedIn ? (
              <div className="flex items-center gap-1.5 text-orange-500 bg-orange-500/10 px-3 py-1.5 rounded-full border border-orange-500/20 shadow-lg shadow-orange-500/5">
                <AlertCircle className="w-3 h-3" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Pending</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-primary bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20 shadow-lg shadow-primary/5">
                <CheckCircle2 className="w-3 h-3" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Active</span>
              </div>
            )}
          </div>

          {athlete.paymentStatus === "overdue" && (
            <div className="flex items-center gap-1.5 text-red-500 bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/20 shadow-lg shadow-red-500/5">
              <CreditCard className="w-3 h-3" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Overdue</span>
            </div>
          )}
          {athlete.paymentStatus === "due_soon" && (
            <div className="flex items-center gap-1.5 text-orange-500 bg-orange-500/10 px-3 py-1.5 rounded-full border border-orange-500/20 shadow-lg shadow-orange-500/5">
              <CreditCard className="w-3 h-3" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Due Soon</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white/[0.02] rounded-2xl p-4 border border-white/[0.03]">
          <p className="label-caps mb-2">Bodyweight</p>
          <p className="text-xl font-display font-bold">{latestCheckin?.weight || '--'}<span className="text-xs ml-1 opacity-40 font-sans">LBS</span></p>
        </div>
        <div className="bg-white/[0.02] rounded-2xl p-4 border border-white/[0.03]">
          <p className="label-caps mb-2">Training</p>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${completion?.completed ? 'bg-primary shadow-[0_0_10px_rgba(38,224,160,0.4)]' : 'bg-white/10'}`} />
            <p className="text-sm font-bold">{completion?.completed ? 'COMPLETED' : 'PENDING'}</p>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-white/[0.05] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-ml-text-dimmed" />
          <p className="text-xs font-medium text-ml-text-dimmed">
            Next: <span className="text-foreground font-bold">{athlete.nextShowDate ? format(new Date(athlete.nextShowDate), 'MMM d') : 'NO DATE'}</span>
          </p>
        </div>
        <div className="flex items-center text-primary group-hover:translate-x-1 transition-all">
          <span className="text-xs font-bold uppercase tracking-widest mr-1">View</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}
