import LayoutAthlete from "@/components/LayoutAthlete";
import { useAuth } from "@/hooks/use-auth";
import { useHealthMarkers, useProtocols } from "@/hooks/use-plans";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HeartPulse } from "lucide-react";
import { Redirect } from "wouter";
import { useState } from "react";
import { format } from "date-fns";

export default function AthleteProtocolsHealth() {
  const { user } = useAuth();
  const { protocols } = useProtocols(user?.id);
  const { healthMarkers, createHealthMarker } = useHealthMarkers(user?.id);
  const [restingHr, setRestingHr] = useState("");
  const [bpSys, setBpSys] = useState("");
  const [bpDia, setBpDia] = useState("");
  const [subjective, setSubjective] = useState("");
  const [notes, setNotes] = useState("");
  const latestMarker = healthMarkers?.[0];
  const previousMarker = healthMarkers?.[1];
  const hrTrendingUp = latestMarker?.restingHr && previousMarker?.restingHr
    ? latestMarker.restingHr > previousMarker.restingHr + 5
    : false;
  const bpTrendingUp = latestMarker?.bloodPressureSystolic && previousMarker?.bloodPressureSystolic
    ? latestMarker.bloodPressureSystolic > previousMarker.bloodPressureSystolic + 10
    : false;

  if (!user || user.role !== "athlete") return <Redirect to="/" />;

  const active = protocols?.filter((item) => !item.endDate) || [];
  const past = protocols?.filter((item) => item.endDate) || [];

  const handleLog = () => {
    createHealthMarker.mutate({
      athleteId: user.id,
      restingHr: restingHr ? Number(restingHr) : null,
      bloodPressureSystolic: bpSys ? Number(bpSys) : null,
      bloodPressureDiastolic: bpDia ? Number(bpDia) : null,
      subjectiveHealth: subjective ? Number(subjective) : null,
      notes: notes || null,
    });
    setRestingHr("");
    setBpSys("");
    setBpDia("");
    setSubjective("");
    setNotes("");
  };

  return (
    <LayoutAthlete>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        <div className="flex items-center gap-3">
          <HeartPulse className="w-6 h-6 text-emerald-500" />
          <h1 className="text-2xl font-bold">Protocols & Health</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Track protocols and health markers. This is informational and not medical advice.
        </p>

        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Active Protocols</h2>
            {active.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {active.map((item) => (
                  <div key={item.id} className="rounded-md border border-border p-3 text-sm">
                    <div className="font-semibold">{item.name}</div>
                    <div className="text-muted-foreground text-xs">{item.dose} • {item.frequency}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No active protocols listed.</div>
            )}
            {past.length > 0 && (
              <div className="pt-4">
                <div className="text-xs uppercase text-muted-foreground mb-2">Past protocols</div>
                <div className="space-y-2 text-xs text-muted-foreground">
                  {past.map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <span>{item.name}</span>
                      <span>{item.endDate ? format(new Date(item.endDate), "MMM d, yyyy") : "—"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Health Markers</h2>
            {(hrTrendingUp || bpTrendingUp) && (
              <div className="rounded-md border border-amber-300/40 bg-amber-100/10 p-3 text-xs text-amber-600">
                Consider reviewing health markers and protocol duration with a medical professional.
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Input value={restingHr} onChange={(event) => setRestingHr(event.target.value)} placeholder="Resting HR" />
              <Input value={bpSys} onChange={(event) => setBpSys(event.target.value)} placeholder="BP systolic" />
              <Input value={bpDia} onChange={(event) => setBpDia(event.target.value)} placeholder="BP diastolic" />
              <Input value={subjective} onChange={(event) => setSubjective(event.target.value)} placeholder="Health 1-10" />
            </div>
            <Input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Notes" />
            <Button type="button" onClick={handleLog}>Log markers</Button>

            <div className="pt-4 space-y-2 text-xs text-muted-foreground">
              {healthMarkers?.map((marker) => (
                <div key={marker.id} className="rounded-md border border-border p-3">
                  <div className="font-semibold">{format(new Date(marker.date), "MMM d, yyyy")}</div>
                  <div>HR {marker.restingHr || "—"} • BP {marker.bloodPressureSystolic || "—"}/{marker.bloodPressureDiastolic || "—"}</div>
                  <div>Health {marker.subjectiveHealth || "—"}/10</div>
                  {marker.notes && <div>{marker.notes}</div>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </LayoutAthlete>
  );
}
