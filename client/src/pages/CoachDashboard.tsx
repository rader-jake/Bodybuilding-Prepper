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

export default function CoachDashboard() {
  const { user, logout } = useAuth();
  const { athletes, createAthlete } = useAthletes();
  const [, setLocation] = useLocation();
  const todayKey = format(new Date(), "yyyy-MM-dd");

  const { data: completions } = useQuery({
    queryKey: [api.trainingCompletions.list.path, todayKey],
    queryFn: async () => {
      const res = await fetch(`${api.trainingCompletions.list.path}?dateKey=${todayKey}`);
      if (!res.ok) throw new Error("Failed to fetch completions");
      return await res.json() as TrainingCompletion[];
    },
    enabled: !!user,
  });

  const { data: coachCheckins } = useQuery({
    queryKey: [api.checkins.queue.path],
    queryFn: async () => {
      const res = await fetch(api.checkins.queue.path);
      if (!res.ok) throw new Error("Failed to fetch check-ins");
      return await res.json() as Array<{ athleteId: number; date: string }>;
    },
    enabled: !!user,
  });
  
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
  const pendingCheckins = Math.max((athletes?.length || 0) - athletesWithCheckin.size, 0);

  return (
    <div className="min-h-screen bg-background pb-16 sm:pb-20">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center font-display font-bold text-lg text-primary-foreground">
              {user.username.substring(0,2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-display uppercase tracking-wide">Coach Dashboard</h1>
              <p className="text-xs text-muted-foreground font-medium">Manage Roster</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" onClick={() => setLocation("/dashboard/checkins")}>
              Check-ins
            </Button>
            <Button variant="ghost" size="icon" onClick={() => logout()} className="text-muted-foreground hover:text-destructive">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-secondary/20 border-border">
            <CardContent className="p-6">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Athletes</p>
              <p className="text-3xl font-display font-bold mt-2">{athletes?.length || 0}</p>
            </CardContent>
          </Card>
          <Card className="bg-secondary/20 border-border">
            <CardContent className="p-6">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pending Check-ins</p>
              <p className="text-3xl font-display font-bold mt-2 text-orange-500">{pendingCheckins}</p>
            </CardContent>
          </Card>
        </div>

        {/* Roster Section */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-2xl font-display uppercase tracking-wide flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              Active Roster
            </h2>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="font-bold uppercase tracking-wider bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Athlete
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="font-display uppercase tracking-wide">Add New Athlete</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateAthlete} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Username</label>
                    <Input value={newAthleteName} onChange={e => setNewAthleteName(e.target.value)} className="bg-secondary/50" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Temporary Password</label>
                    <Input type="password" value={newAthletePass} onChange={e => setNewAthletePass(e.target.value)} className="bg-secondary/50" />
                  </div>
                  <Button type="submit" className="w-full font-bold uppercase tracking-wider bg-primary">Create Profile</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Search athletes..." 
              className="pl-12 h-12 bg-secondary/20 border-transparent focus:bg-secondary/40 text-lg"
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            {athletes?.map((athlete) => (
              <AthleteCard 
                key={athlete.id} 
                athlete={athlete} 
                onOpen={() => setLocation(`/dashboard/athletes/${athlete.id}`)}
                completion={completions?.find((item) => item.athleteId === athlete.id)}
              />
            ))}
            {athletes?.length === 0 && (
              <div className="text-center py-20 text-muted-foreground bg-secondary/10 rounded-xl border border-dashed border-border">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No athletes found. Add your first client.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function AthleteCard({
  athlete,
  onOpen,
  completion,
}: {
  athlete: any;
  onOpen: () => void;
  completion?: TrainingCompletion;
}) {
  const { checkins } = useCheckins(athlete.id);
  const latestCheckin = checkins?.[0];

  return (
    <Card className="overflow-hidden transition-all duration-300 border-border bg-card hover:border-primary/50 group cursor-pointer">
      <div 
        className="p-5 sm:p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        onClick={onOpen}
      >
        <div className="flex items-center gap-4">
          <Avatar className="w-12 h-12 border border-border bg-gradient-to-br from-secondary to-background">
            {athlete.avatarUrl ? <AvatarImage src={athlete.avatarUrl} alt={`${athlete.username} avatar`} /> : null}
            <AvatarFallback className="font-display font-bold text-xl text-muted-foreground group-hover:text-primary transition-colors">
              {athlete.username.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-display font-bold text-lg tracking-wide group-hover:text-primary transition-colors">{athlete.username}</h3>
            <p className="text-sm text-muted-foreground">
              Last check-in: {latestCheckin ? format(new Date(latestCheckin.date), 'MMM d, yyyy') : 'Never'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {latestCheckin ? (
            <div className="flex items-center gap-2 text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4" />
              <span>On Track</span>
            </div>
          ) : (
             <div className="flex items-center gap-2 text-orange-500 bg-orange-500/10 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              <AlertCircle className="w-4 h-4" />
              <span>No Data</span>
            </div>
          )}
          <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${completion?.completed ? "bg-emerald-500/10 text-emerald-500" : "bg-secondary/40 text-muted-foreground"}`}>
            {completion?.completed ? "Workout done" : "Workout pending"}
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1" />
        </div>
      </div>
    </Card>
  );
}
