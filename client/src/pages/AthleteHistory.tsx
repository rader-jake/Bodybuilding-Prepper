import { useAuth } from "@/hooks/use-auth";
import { useCheckins } from "@/hooks/use-checkins";
import LayoutAthlete from "@/components/LayoutAthlete";
import { Redirect, Link } from "wouter";
import { format } from "date-fns";
import { ChevronLeft, MessageSquare, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { POSE_KEYS, type PoseKey } from "@/lib/poses";
import { useState } from "react";

export default function AthleteHistory() {
  const { user } = useAuth();
  const { checkins, isLoading } = useCheckins(user?.id);
  const [selectedPose, setSelectedPose] = useState<PoseKey>(POSE_KEYS[0].key);

  if (!user || user.role !== 'athlete') return <Redirect to="/" />;

  return (
    <LayoutAthlete>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/athlete/check-in">
             <Button variant="ghost" size="icon" className="-ml-2">
               <ChevronLeft className="w-6 h-6" />
             </Button>
          </Link>
          <h1 className="text-xl font-display uppercase tracking-wide">History & Feedback</h1>
        </div>

        {isLoading && <div className="text-center py-10 text-muted-foreground">Loading history...</div>}
        
        {!isLoading && checkins?.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            No check-ins yet. Time to get to work.
          </div>
        )}

        {checkins && checkins.length > 0 && (
          <Card className="border-border bg-card">
            <div className="px-6 py-4 border-b border-border flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h2 className="font-display font-bold text-lg tracking-wide flex items-center gap-2">
                  <Camera className="w-5 h-5 text-primary" />
                  Pose Comparison
                </h2>
                <p className="text-xs text-muted-foreground">Track progress in a single pose over time.</p>
              </div>
              <select
                className="border border-border bg-background px-3 py-2 rounded-md text-sm"
                value={selectedPose}
                onChange={(event) => setSelectedPose(event.target.value as PoseKey)}
              >
                {POSE_KEYS.map((pose) => (
                  <option key={pose.key} value={pose.key}>
                    {pose.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="p-6">
              <div className="flex gap-3 overflow-x-auto pb-2">
                {checkins.map((checkin) => (
                  <div key={checkin.id} className="min-w-[140px] space-y-2">
                    <div className="aspect-square rounded-lg border border-border bg-secondary/20 overflow-hidden">
                      {checkin.posePhotos?.[selectedPose] ? (
                        <img
                          src={checkin.posePhotos[selectedPose]}
                          alt={`${selectedPose} ${checkin.date}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                          No photo
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(checkin.date), "MMM d")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {checkins?.map((checkin) => (
          <Card key={checkin.id} className="overflow-hidden border-border bg-card">
            <div className="bg-secondary/30 px-6 py-4 flex justify-between items-center border-b border-border">
              <span className="font-display font-bold text-lg tracking-wide">{format(new Date(checkin.date), 'MMMM d, yyyy')}</span>
              <span className="font-mono text-primary font-bold">{checkin.weight} lbs</span>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
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

              {checkin.coachFeedback ? (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-primary font-bold uppercase text-xs tracking-wider mb-2">
                    <MessageSquare className="w-4 h-4" />
                    Coach Feedback
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/90">{checkin.coachFeedback}</p>
                </div>
              ) : (
                <div className="text-center py-2 text-sm text-muted-foreground italic">
                  Awaiting coach feedback...
                </div>
              )}
              {checkin.programChanges && (
                <div className="rounded-lg border border-border bg-secondary/20 p-4">
                  <div className="text-xs text-muted-foreground uppercase font-bold mb-2">Program Changes</div>
                  <p className="text-sm text-muted-foreground">{checkin.programChanges}</p>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </LayoutAthlete>
  );
}
