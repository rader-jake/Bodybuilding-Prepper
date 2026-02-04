import { useAuth } from "@/hooks/use-auth";
import { useAthletes } from "@/hooks/use-athletes";
import { useCheckins } from "@/hooks/use-checkins";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus, Users, Search, AlertCircle, CheckCircle2, ChevronRight, LogOut } from "lucide-react";
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

export default function CoachDashboard() {
  const { user, logout } = useAuth();
  const { athletes, createAthlete } = useAthletes();
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

  if (!user || user.role !== 'coach') return <Redirect to="/" />;

  const handleCreateAthlete = (e: React.FormEvent) => {
    e.preventDefault();
    createAthlete.mutate({ username: newAthleteName, password: newAthletePass, role: 'athlete', coachId: user.id }, {
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

  const pendingCheckins = Math.max((athletes?.length || 0) - athletesWithCheckin.size, 0);

  return (
    <LayoutCoach>
      <div className="space-y-8">

        {!athletes || athletes.length === 0 ? (
          <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-[0_0_30px_rgba(var(--primary),0.1)] mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl shadow-lg">1</div>
              <div>
                <h3 className="text-lg font-bold text-primary">Build your roster.</h3>
                <p className="text-sm text-muted-foreground">Add your first athlete to start tracking their progress.</p>
              </div>
            </div>
            <Button onClick={() => setIsDialogOpen(true)} className="w-full md:w-auto font-bold uppercase tracking-widest shadow-lg shadow-primary/20 animate-pulse">
              Add Athlete <Plus className="w-4 h-4 ml-2" />
            </Button>
          </div>
        ) : null}

        <div className="hidden md:flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Coach Dashboard</h1>
        </div>
        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-secondary/10 border-border/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Roster</p>
              <div className="flex items-end gap-2 mt-2">
                <p className="text-3xl font-bold leading-none">{athletes?.length || 0}</p>
                <p className="text-xs text-muted-foreground mb-1">Athletes</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-orange-500/5 border-orange-500/20 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <p className="text-xs font-medium text-muted-foreground tracking-wider">Attention Required</p>
                <TooltipHelper preferenceKey={PREFERENCES_KEYS.HAS_SEEN_COACH_DASHBOARD_TOOLTIP} content="This number shows how many athletes on your roster have NOT submitted their check-in for the current week." side="top">
                  <AlertCircle className="w-3 h-3 text-orange-500/50 cursor-help" />
                </TooltipHelper>
              </div>
              <div className="flex items-end gap-2 mt-2">
                <p className="text-4xl font-display font-bold leading-none text-orange-500">{pendingCheckins}</p>
                <p className="text-xs text-orange-500/60 mb-1">Pending Check-ins</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-emerald-500/5 border-emerald-500/20 backdrop-blur-sm">
            <CardContent className="p-6">
              <p className="text-xs font-medium text-muted-foreground tracking-wider">Weekly Compliance</p>
              <div className="flex items-end gap-2 mt-2">
                <p className="text-4xl font-display font-bold leading-none text-emerald-500">
                  {athletes?.length ? Math.round((athletesWithCheckin.size / athletes.length) * 100) : 0}%
                </p>
                <p className="text-xs text-emerald-500/60 mb-1">Checked In</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Roster Section */}
        < div className="space-y-6" >
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
                  <Button className="font-bold uppercase tracking-wider bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 ml-auto md:ml-0">
                    <Plus className="w-4 h-4 mr-2" />
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
        </div >
      </div >
    </LayoutCoach >
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
    <Card
      className={`overflow-hidden transition-all duration-300 border-border/50 bg-card hover:border-primary/50 group cursor-pointer shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 ${!hasCheckedIn ? 'border-l-4 border-l-orange-500' : 'border-l-4 border-l-emerald-500'}`}
      onClick={onOpen}
    >
      <CardContent className="p-5 flex flex-col h-full">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12 border-2 border-border shadow-inner">
              {athlete.avatarUrl ? <AvatarImage src={athlete.avatarUrl} alt={`${athlete.username} avatar`} /> : null}
              <AvatarFallback className="font-display font-bold text-xl bg-secondary text-muted-foreground group-hover:text-primary transition-colors">
                {athlete.username.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-display font-bold text-lg tracking-wide group-hover:text-primary transition-colors leading-tight">
                {athlete.displayName || athlete.username}
              </h3>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-0.5">
                {athlete.currentPhase || 'Off-season'}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {!hasCheckedIn ? (
              <span className="text-[9px] font-bold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                Pending Check-in
              </span>
            ) : (
              <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                Checked In
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-secondary/20 rounded-lg p-2 border border-border/30">
            <p className="text-[9px] text-muted-foreground uppercase font-bold">Latest Weight</p>
            <p className="text-sm font-bold font-display">{latestCheckin?.weight || '--'}</p>
          </div>
          <div className="bg-secondary/20 rounded-lg p-2 border border-border/30">
            <p className="text-[9px] text-muted-foreground uppercase font-bold">Today's Training</p>
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${completion?.completed ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-secondary'}`} />
              <p className="text-xs font-bold leading-none">{completion?.completed ? 'Logged' : 'Pending'}</p>
            </div>
          </div>
        </div>

        <div className="mt-auto pt-3 border-t border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <CalendarDays className="w-3 h-3 text-muted-foreground" />
            <p className="text-[10px] text-muted-foreground font-medium">
              Next: <span className="text-foreground">{athlete.nextShowDate ? format(new Date(athlete.nextShowDate), 'MMM d') : 'No Date'}</span>
            </p>
          </div>
          <div className="flex items-center text-primary group-hover:translate-x-1 transition-transform">
            <span className="text-[10px] font-bold uppercase tracking-wider mr-1">Profile</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

import { CalendarDays } from "lucide-react";
