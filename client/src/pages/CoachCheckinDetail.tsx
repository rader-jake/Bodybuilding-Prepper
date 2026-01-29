import { useAuth } from "@/hooks/use-auth";
import { useCheckins } from "@/hooks/use-checkins";
import { useAthletes } from "@/hooks/use-athletes";
import { useQuery } from "@tanstack/react-query";
import { api, type Checkin } from "@shared/routes";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { POSE_KEYS } from "@/lib/poses";
import { format } from "date-fns";
import { Redirect, useLocation, useRoute } from "wouter";
import { useEffect, useState } from "react";

export default function CoachCheckinDetail() {
  const { user } = useAuth();
  const { updateCheckin } = useCheckins();
  const { athletes } = useAthletes();
  const [, params] = useRoute("/dashboard/checkins/:id");
  const [, setLocation] = useLocation();

  const checkinId = Number(params?.id);

  const { data: checkins, isLoading } = useQuery({
    queryKey: [api.checkins.queue.path],
    queryFn: async () => {
      const res = await fetch(api.checkins.queue.path);
      if (!res.ok) throw new Error("Failed to fetch check-ins");
      return await res.json() as Checkin[];
    },
    enabled: !!user,
  });

  if (!user || user.role !== "coach") return <Redirect to="/" />;
  if (!params?.id) return <Redirect to="/dashboard/checkins" />;

  const checkin = checkins?.find((item) => item.id === checkinId);
  const athlete = checkin ? athletes?.find((item) => item.id === checkin.athleteId) : null;

  // Find previous check-in for comparison
  const athleteCheckins = checkins?.filter(c => c.athleteId === checkin?.athleteId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) || [];

  const checkinIndex = athleteCheckins.findIndex(c => c.id === checkinId);
  const previousCheckin = athleteCheckins[checkinIndex + 1];

  const [feedback, setFeedback] = useState(checkin?.coachFeedback || "");
  const [poseRatings, setPoseRatings] = useState<Record<string, number>>(checkin?.poseRatings || {});
  const [status, setStatus] = useState(checkin?.status || "new");
  const [coachChange, setCoachChange] = useState("");
  const [coachChanges, setCoachChanges] = useState<string[]>(checkin?.coachChanges || []);

  const [activePose, setActivePose] = useState<string>(POSE_KEYS[0].key);

  useEffect(() => {
    if (!checkin) return;
    setFeedback(checkin.coachFeedback || "");
    setPoseRatings(checkin.poseRatings || {});
    setStatus(checkin.status || "new");
    setCoachChanges(checkin.coachChanges || []);
  }, [checkin]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground font-display font-bold uppercase tracking-widest">Loading Athlete Data</p>
        </div>
      </div>
    );
  }

  if (!checkin) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Button variant="ghost" onClick={() => setLocation("/dashboard/checkins")}>Back</Button>
        <p className="text-center mt-20 text-muted-foreground">Check-in not found.</p>
      </div>
    );
  }

  const handleSave = () => {
    updateCheckin.mutate({
      id: checkin.id,
      coachFeedback: feedback,
      poseRatings,
      status,
      coachChanges,
    });
  };

  const handleAddChange = () => {
    if (!coachChange) return;
    const next = [...coachChanges, coachChange];
    setCoachChanges(next);
    setCoachChange("");
    updateCheckin.mutate({ id: checkin.id, coachChanges: next });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-[1600px] mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/dashboard/checkins")}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              Queue
            </Button>
            <div className="h-6 w-px bg-border/50" />
            <div>
              <h1 className="font-display font-bold text-lg leading-tight uppercase tracking-tight">
                {athlete?.displayName || athlete?.username}
              </h1>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">
                {format(new Date(checkin.date), "MMM d, yyyy")} • {checkin.weight} LBS
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${status === 'new' ? 'bg-primary/10 text-primary border-primary/20' :
                status === 'reviewed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                  'bg-orange-500/10 text-orange-500 border-orange-500/20'
              }`}>
              {status.replace(/-/g, ' ')}
            </div>
            <Button onClick={handleSave} className="font-bold uppercase tracking-widest h-9 bg-primary shadow-lg shadow-primary/20" disabled={updateCheckin.isPending}>
              {updateCheckin.isPending ? "Saving..." : "Save Review"}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-4rem)] overflow-hidden">
        {/* Left Column: Visuals */}
        <div className="lg:col-span-8 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
          {/* Photo Comparison Section */}
          <Card className="border-border/50 shadow-sm flex flex-col h-full bg-card/30">
            <CardContent className="p-0 flex flex-col h-full">
              <div className="p-4 border-b border-border/50 flex items-center justify-between bg-secondary/5">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  Side-by-Side Comparison
                </h3>
                <div className="flex bg-secondary/20 p-1 rounded-lg border border-border/50 max-w-full overflow-x-auto gap-1">
                  {POSE_KEYS.map(p => (
                    <button
                      key={p.key}
                      onClick={() => setActivePose(p.key)}
                      className={`px-3 py-1 text-[9px] font-bold uppercase tracking-tighter whitespace-nowrap rounded-md transition-all ${activePose === p.key ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 grid grid-cols-2 gap-px bg-border/50 p-4">
                <div className="flex flex-col gap-3">
                  <div className="text-[10px] font-bold uppercase text-center text-muted-foreground tracking-widest">
                    {previousCheckin ? format(new Date(previousCheckin.date), 'MMM d') : 'No Prior Data'}
                  </div>
                  <div className="flex-1 rounded-xl overflow-hidden bg-secondary/10 relative group">
                    {previousCheckin?.posePhotos?.[activePose] ? (
                      <img
                        src={previousCheckin.posePhotos[activePose]}
                        className="w-full h-full object-contain bg-black/20"
                        alt="Previous"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 font-display italic">Missing Photo</div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="text-[10px] font-bold uppercase text-center text-primary tracking-widest">
                    THIS WEEK • {checkin.weight} LBS
                  </div>
                  <div className="flex-1 rounded-xl overflow-hidden bg-secondary/10 relative ring-2 ring-primary/20">
                    {checkin.posePhotos?.[activePose] ? (
                      <img
                        src={checkin.posePhotos[activePose]}
                        className="w-full h-full object-contain bg-black/20"
                        alt="Current"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 font-display italic">Missing Photo</div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <MetricBox label="Sleep" value={checkin.sleep} prev={previousCheckin?.sleep} color="primary" />
            <MetricBox label="Stress" value={checkin.stress} prev={previousCheckin?.stress} color="orange-500" inverse />
            <MetricBox label="Energy" value={(checkin as any).energy} prev={(previousCheckin as any)?.energy} color="yellow-500" />
            <MetricBox label="Hunger" value={(checkin as any).hunger} prev={(previousCheckin as any)?.hunger} color="red-500" inverse />
            <MetricBox label="Mood" value={(checkin as any).mood} prev={(previousCheckin as any)?.mood} color="pink-500" />
            <MetricBox label="Digestion" value={(checkin as any).digestion} prev={(previousCheckin as any)?.digestion} color="emerald-500" />
            <MetricBox label="Adherence" value={checkin.adherence} prev={previousCheckin?.adherence} color="emerald-600" />
            <Card className="bg-secondary/10 border-border/50 p-4">
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Morning Weight</p>
              <div className="flex items-baseline gap-2">
                <p className="text-xl font-display font-bold">{checkin.weight}</p>
                {previousCheckin && (
                  <p className={`text-[10px] font-bold ${parseFloat(checkin.weight) <= parseFloat(previousCheckin.weight) ? 'text-emerald-500' : 'text-orange-500'}`}>
                    {parseFloat(checkin.weight) <= parseFloat(previousCheckin.weight) ? '↓' : '↑'} {Math.abs(parseFloat(checkin.weight) - parseFloat(previousCheckin.weight)).toFixed(1)}
                  </p>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Right Column: Feedback & Controls */}
        <div className="lg:col-span-4 flex flex-col gap-6 overflow-y-auto px-1 pb-10 custom-scrollbar">
          <Card className="border-border/50 shadow-sm bg-card">
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Athlete Notes</h3>
                <div className="p-4 rounded-xl bg-secondary/20 border border-border/30 text-sm leading-relaxed italic text-foreground/90 whitespace-pre-wrap">
                  {checkin.notes || "No notes provided."}
                </div>
              </div>

              {checkin.programChanges && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-primary/80">Program Adjustments Made by Athlete</h3>
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                    {checkin.programChanges}
                  </div>
                </div>
              )}

              <div className="space-y-4 pt-4 border-t border-border/50">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center justify-between">
                    Coach Response
                    <span className="text-[9px] font-normal normal-case">Athlete will see this as feedback</span>
                  </label>
                  <textarea
                    value={feedback}
                    onChange={(event) => setFeedback(event.target.value)}
                    placeholder="Enter coaching cues, encouragement, or plan adjustments..."
                    className="w-full min-h-[160px] p-4 rounded-xl bg-background border border-border focus:border-primary/50 text-sm leading-relaxed resize-none focus:ring-1 focus:ring-primary/20 transition-all font-body"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Action Log (Internal)</label>
                  <div className="space-y-2">
                    {coachChanges.map((change, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-2 p-2 rounded bg-secondary/20 border border-border/30 text-[11px] font-medium">
                        <span className="truncate">{change}</span>
                        <button onClick={() => setCoachChanges(prev => prev.filter((_, i) => i !== idx))} className="text-muted-foreground hover:text-destructive">×</button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={coachChange}
                      onChange={(e) => setCoachChange(e.target.value)}
                      placeholder="e.g. +20g Protein"
                      className="h-9 text-xs bg-background"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddChange()}
                    />
                    <Button size="sm" onClick={handleAddChange} variant="secondary" className="h-9 px-3">Add</Button>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Status Update</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['new', 'reviewed', 'needs-follow-up'].map((s) => (
                      <button
                        key={s}
                        onClick={() => setStatus(s)}
                        className={`py-2 px-1 text-[10px] font-bold uppercase tracking-tighter rounded-lg border transition-all ${status === s
                            ? 'bg-primary border-primary text-primary-foreground shadow-md shadow-primary/20'
                            : 'bg-background border-border text-muted-foreground hover:border-primary/30'
                          }`}
                      >
                        {s.replace(/-/g, ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function MetricBox({ label, value, prev, color, inverse = false }: { label: string, value: any, prev?: any, color: string, inverse?: boolean }) {
  const diff = prev !== undefined ? value - prev : 0;
  const isBetter = inverse ? diff < 0 : diff > 0;
  const isWorse = inverse ? diff > 0 : diff < 0;

  return (
    <Card className="bg-secondary/10 border-border/50 p-4">
      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
      <div className="flex items-baseline gap-2">
        <p className="text-xl font-display font-bold">{value || '0'}<span className="text-[10px] text-muted-foreground">/10</span></p>
        {prev !== undefined && diff !== 0 && (
          <span className={`text-[10px] font-bold ${isBetter ? 'text-emerald-500' : isWorse ? 'text-orange-500' : 'text-muted-foreground'}`}>
            {diff > 0 ? '+' : ''}{diff}
          </span>
        )}
      </div>
      <div className="mt-2 h-1 w-full bg-secondary rounded-full overflow-hidden">
        <div className={`h-full bg-${color} rounded-full`} style={{ width: `${(value || 0) * 10}%` }} />
      </div>
    </Card>
  );
}

import { ChevronLeft, Image, MessageSquare } from "lucide-react";
