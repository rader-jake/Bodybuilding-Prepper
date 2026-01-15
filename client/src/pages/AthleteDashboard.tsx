import LayoutAthlete from "@/components/LayoutAthlete";
import { useAuth } from "@/hooks/use-auth";
import { useCheckins } from "@/hooks/use-checkins";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow, format } from "date-fns";
import { Link } from "wouter";
import { useNutritionPlans, useWeeklyTrainingPlans, useTrainingCompletions } from "@/hooks/use-plans";
import { Activity, BarChart3, CalendarDays, ClipboardCheck, MessageSquare, Utensils } from "lucide-react";

export default function AthleteDashboard() {
  const { user } = useAuth();
  const { checkins, isLoading } = useCheckins(user?.id);
  const { weeklyPlans } = useWeeklyTrainingPlans(user?.id);
  const { nutritionPlans } = useNutritionPlans(user?.id);
  const todayKey = format(new Date(), "yyyy-MM-dd");
  const todayLabel = format(new Date(), "EEEE");
  const { completions, createCompletion, updateCompletion } = useTrainingCompletions(user?.id, todayKey);

  const last = checkins && checkins.length > 0 ? checkins[0] : null;
  const currentWorkoutPlan = weeklyPlans?.[0];
  const currentNutritionPlan = nutritionPlans?.[0];
  const todaysPlan = (currentWorkoutPlan?.planJson as { days?: Array<{ day: string; focus?: string }> })?.days
    ?.find((day) => day.day?.toLowerCase() === todayLabel.toLowerCase());
  const todaysCompletion = completions?.find((item) => item.dayKey === todayLabel);
  const workoutPlanLink = user?.workoutPlan || (currentWorkoutPlan ? "/athlete/workout-plan" : undefined);
  const mealPlanLink = user?.mealPlan || (currentNutritionPlan ? "/athlete/meal-plan" : undefined);
  const hasWorkoutLink = workoutPlanLink?.startsWith("http");
  const hasMealLink = mealPlanLink?.startsWith("http");

  return (
    <LayoutAthlete>
      <div className="space-y-6">
        <div className="bg-card rounded-lg p-5 sm:p-6 shadow-sm border border-border space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Athlete Dashboard</div>
              <h2 className="text-xl sm:text-2xl font-bold truncate">Welcome back, {user?.displayName || user?.username}</h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">Phase</span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-secondary/40 border border-border">
              {user?.currentPhase || "off-season"}
            </span>
            {user?.nextShowName && user.nextShowDate && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                {user.nextShowName} • {format(new Date(user.nextShowDate), "MMM d")}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground">Weekly check-ins keep your coach aligned.</div>
            <Link href="/athlete/check-in">
              <Button className="bg-primary">Submit Check-In</Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                This Week's Overview
              </h3>
              {isLoading && <div className="text-sm text-muted-foreground">Loading...</div>}
              {!isLoading && !last && <div className="text-sm text-muted-foreground mt-4">No check-ins yet. Submit your first weekly check-in.</div>}
              {last && (
                <div className="mt-4 space-y-2">
                  <div className="text-sm text-muted-foreground">Last check-in: <span className="font-bold">{format(new Date(last.date), 'MMM d, yyyy')}</span></div>
                  <div className="text-sm">Weight: <span className="font-bold">{last.weight}</span></div>
                  <div className="text-sm">Status: <span className="px-2 py-1 rounded text-xs bg-emerald-500/10 text-emerald-500">On track</span></div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Workout Plan
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                {hasWorkoutLink
                  ? "Coach shared a workout plan document."
                  : (currentWorkoutPlan ? "Current week plan ready to view." : "No structured workout plan yet.")}
              </p>
              <div className="pt-2">
                {hasWorkoutLink ? (
                  <a href={workoutPlanLink} target="_blank" rel="noreferrer">
                    <Button variant="ghost">Open workout plan</Button>
                  </a>
                ) : (
                  <Link href="/athlete/workout-plan"><Button variant="ghost">View full workout plan</Button></Link>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Utensils className="w-5 h-5 text-primary" />
                Meal Plan
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                {hasMealLink
                  ? "Coach shared a meal plan document."
                  : (currentNutritionPlan ? "Current week macros ready to view." : "No meal plan yet.")}
              </p>
              <div className="pt-2">
                {hasMealLink ? (
                  <a href={mealPlanLink} target="_blank" rel="noreferrer">
                    <Button variant="ghost">Open meal plan</Button>
                  </a>
                ) : (
                  <Link href="/athlete/meal-plan"><Button variant="ghost">View full meal plan</Button></Link>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Coach Notes
              </h3>
              <div className="mt-2 text-sm text-muted-foreground">{last?.coachFeedback || 'No feedback yet from your coach.'}</div>
              <div className="pt-2">
                <Link href="/athlete/history"><Button variant="ghost">View history</Button></Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-primary" />
                Show Countdown
              </h3>
              {user?.nextShowDate ? (
                <div className="mt-2 text-sm text-muted-foreground">
                  {user?.nextShowName || "Next show"} in {formatDistanceToNow(new Date(user.nextShowDate), { addSuffix: false })}
                </div>
              ) : (
                <div className="mt-2 text-sm text-muted-foreground">No show date set yet.</div>
              )}
              <div className="pt-2">
                <Link href="/athlete/calendar"><Button variant="ghost">Open calendar</Button></Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-primary" />
                Today's Training
              </h3>
              <div className="mt-2 text-sm text-muted-foreground">
                {todaysPlan ? `${todaysPlan.day} • ${todaysPlan.focus || "Training"}` : "No training assigned today."}
              </div>
              {todaysPlan && (
                <label className="mt-2 flex items-center gap-2 rounded-md border border-border bg-secondary/20 px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={todaysCompletion?.completed || false}
                    onChange={(event) => {
                      if (!user) return;
                      if (!todaysCompletion) {
                        createCompletion.mutate({
                          athleteId: user.id,
                          dateKey: todayKey,
                          dayKey: todayLabel,
                          completed: event.target.checked,
                        });
                        return;
                      }
                      updateCompletion.mutate({
                        id: todaysCompletion.id,
                        completed: event.target.checked,
                      });
                    }}
                  />
                  Mark workout complete
                </label>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </LayoutAthlete>
  );
}
