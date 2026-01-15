import LayoutAthlete from "@/components/LayoutAthlete";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useTrainingBlocks, useWeeklyTrainingPlans } from "@/hooks/use-plans";
import { Activity } from "lucide-react";

const mockPlan = [
  { day: 'Monday', focus: 'Chest / Triceps', notes: 'Bench, incline, pushdowns' },
  { day: 'Tuesday', focus: 'Back / Biceps', notes: 'Rows, pullups, curls' },
  { day: 'Wednesday', focus: 'Legs', notes: 'Squat, lunges, hamstrings' },
  { day: 'Thursday', focus: 'Shoulders', notes: 'Press, lateral raises' },
  { day: 'Friday', focus: 'Full Body / Conditioning', notes: 'Circuit' },
];

export default function WorkoutPlan() {
  const { user } = useAuth();
  const { trainingBlocks } = useTrainingBlocks(user?.id);
  const { weeklyPlans } = useWeeklyTrainingPlans(user?.id);
  const planLink = user?.workoutPlan ?? undefined;
  const hasPlanLink = !!planLink && planLink.startsWith("http");
  const currentBlock = trainingBlocks?.[0];
  const currentPlan = weeklyPlans?.[0];
  const planDays = (currentPlan?.planJson as { days?: Array<{ day: string; focus?: string; notes?: string }> })?.days;

  return (
    <LayoutAthlete>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Activity className="w-6 h-6 text-primary" />
          Workout Plan
        </h1>
        <Card>
          <CardContent>
            {hasPlanLink ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Your coach shared a workout plan document.</p>
                <a href={planLink} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">
                  Open workout plan
                </a>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {currentBlock ? `Phase: ${currentBlock.phase || "current"} • ${currentBlock.name}` : "Current training block"}
                  </p>
                  {currentBlock?.focus && <p className="text-sm text-muted-foreground">{currentBlock.focus}</p>}
                </div>
                <div className="mt-4 grid gap-3">
                  {(planDays && planDays.length > 0 ? planDays : mockPlan).map((p) => (
                    <div key={p.day} className="p-4 rounded border border-border bg-background">
                      <div className="flex justify-between items-center">
                        <div className="font-bold">{p.day}</div>
                        <div className="text-sm text-muted-foreground">{p.focus || "Training Focus"}</div>
                      </div>
                      <div className="text-sm mt-2 text-muted-foreground">{p.notes || "Details coming soon."}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </LayoutAthlete>
  );
}
