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

  const [feedback, setFeedback] = useState(checkin?.coachFeedback || "");
  const [poseRatings, setPoseRatings] = useState<Record<string, number>>(checkin?.poseRatings || {});
  const [status, setStatus] = useState(checkin?.status || "new");
  const [coachChange, setCoachChange] = useState("");
  const [coachChanges, setCoachChanges] = useState<string[]>(checkin?.coachChanges || []);

  useEffect(() => {
    if (!checkin) return;
    setFeedback(checkin.coachFeedback || "");
    setPoseRatings(checkin.poseRatings || {});
    setStatus(checkin.status || "new");
    setCoachChanges(checkin.coachChanges || []);
  }, [checkin]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-6 py-10 text-muted-foreground">Loading check-in...</div>
      </div>
    );
  }

  if (!checkin) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-6 py-10 space-y-4">
          <Button variant="ghost" onClick={() => setLocation("/dashboard/checkins")}>Back</Button>
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">Check-in not found.</CardContent>
          </Card>
        </div>
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
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between text-left">
          <Button variant="ghost" onClick={() => setLocation("/dashboard/checkins")} className="self-start">Back to queue</Button>
          <div className="text-xs text-muted-foreground uppercase tracking-widest">Check-in Review</div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        <Card>
          <CardContent className="p-6 space-y-2">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Athlete</div>
            <div className="text-xl font-semibold">{athlete?.displayName || athlete?.username || `Athlete ${checkin.athleteId}`}</div>
            <div className="text-sm text-muted-foreground">
              {format(new Date(checkin.date), "MMMM d, yyyy")} • {checkin.weight} lbs
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardContent className="p-6 space-y-6">
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Pose Photos</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
                  {POSE_KEYS.map((pose) => (
                    <div key={pose.key} className="rounded-md border border-border overflow-hidden bg-secondary/20">
                      {checkin.posePhotos?.[pose.key] ? (
                        <img src={checkin.posePhotos[pose.key]} alt={pose.label} className="w-full h-28 object-cover" />
                      ) : (
                        <div className="h-28 flex items-center justify-center text-[11px] text-muted-foreground">
                          {pose.label}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded bg-background border border-border">
                  <div className="text-xs text-muted-foreground uppercase font-bold mb-1">Sleep</div>
                  <div className="font-mono font-bold text-lg">{checkin.sleep}/10</div>
                </div>
                <div className="p-3 rounded bg-background border border-border">
                  <div className="text-xs text-muted-foreground uppercase font-bold mb-1">Stress</div>
                  <div className="font-mono font-bold text-lg text-orange-500">{checkin.stress}/10</div>
                </div>
                <div className="p-3 rounded bg-background border border-border">
                  <div className="text-xs text-muted-foreground uppercase font-bold mb-1">Adherence</div>
                  <div className="font-mono font-bold text-lg text-emerald-500">{checkin.adherence}/10</div>
                </div>
              </div>

              {checkin.programChanges && (
                <div className="rounded-lg border border-border bg-secondary/20 p-4 text-sm">
                  <div className="text-xs text-muted-foreground uppercase font-bold mb-2">Program Changes</div>
                  <p className="text-muted-foreground">{checkin.programChanges}</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground uppercase font-bold">Pose Ratings</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {POSE_KEYS.map((pose) => (
                    <div key={pose.key} className="flex items-center justify-between gap-2 rounded-md border border-border px-2 py-1 text-xs">
                      <span className="text-muted-foreground">{pose.label}</span>
                      <select
                        className="bg-background text-xs"
                        value={poseRatings?.[pose.key] || ""}
                        onChange={(event) => {
                          const rating = Number(event.target.value);
                          const next = { ...poseRatings, [pose.key]: rating };
                          setPoseRatings(next);
                        }}
                      >
                        <option value="">-</option>
                        {[1, 2, 3, 4, 5].map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground uppercase font-bold">Status</label>
                <select
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                >
                  <option value="new">New</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="needs-follow-up">Needs Follow-up</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground uppercase font-bold">Coach Feedback</label>
                <textarea
                  value={feedback}
                  onChange={(event) => setFeedback(event.target.value)}
                  className="w-full min-h-[120px] p-3 rounded bg-secondary/50 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground uppercase font-bold">Change Log</label>
                <div className="space-y-2 text-xs text-muted-foreground">
                  {coachChanges.length ? coachChanges.map((change, idx) => (
                    <div key={idx} className="rounded-md border border-border px-3 py-2">{change}</div>
                  )) : <div>No updates logged.</div>}
                </div>
                <div className="flex items-center gap-2">
                  <Input value={coachChange} onChange={(event) => setCoachChange(event.target.value)} placeholder="Updated macros..." />
                  <Button type="button" size="sm" onClick={handleAddChange}>Add</Button>
                </div>
              </div>
              <Button type="button" onClick={handleSave}>Save Review</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
