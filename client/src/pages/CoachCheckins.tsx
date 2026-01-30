import { useAuth } from "@/hooks/use-auth";
import { useAthletes } from "@/hooks/use-athletes";
import { useQuery } from "@tanstack/react-query";
import { api, type Checkin } from "@shared/routes";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Redirect, Link } from "wouter";
import LayoutCoach from "@/components/LayoutCoach";

export default function CoachCheckins() {
  const { user } = useAuth();
  const { athletes } = useAthletes();

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

  return (
    <LayoutCoach title="Check-ins Queue">
      <div className="space-y-4">
        <div className="hidden md:flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Check-ins Queue</h1>
            <p className="text-xs text-muted-foreground">Review new submissions and follow up.</p>
          </div>
        </div>
        {isLoading && <div className="text-sm text-muted-foreground">Loading check-ins...</div>}
        {!isLoading && (!checkins || checkins.length === 0) && (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No check-ins to review yet.
            </CardContent>
          </Card>
        )}
        {checkins?.map((checkin) => {
          const athlete = athletes?.find((item) => item.id === checkin.athleteId);
          const status = checkin.status || "new";
          return (
            <Card key={checkin.id} className="border-border bg-card">
              <CardContent className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Athlete</div>
                  <div className="text-lg font-semibold">{athlete?.displayName || athlete?.username || `Athlete ${checkin.athleteId}`}</div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(checkin.date), "MMM d, yyyy")} • {checkin.weight} lbs
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${status === "reviewed" ? "bg-emerald-500/15 text-emerald-500" : "bg-primary/10 text-primary"}`}>
                    {status}
                  </span>
                  <Link href={`/dashboard/checkins/${checkin.id}`}>
                    <Button size="sm">Review</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </LayoutCoach>
  );
}
