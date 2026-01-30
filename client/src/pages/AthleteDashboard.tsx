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
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-card border border-border p-6 sm:p-8 shadow-sm">
          <div className="relative z-10 flex flex-col md:items-center md:flex-row justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest border border-primary/20">
                  {user?.currentPhase || "Off-season"}
                </span>
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Current Training Phase</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Welcome, {user?.displayName || user?.username}
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base max-w-lg">
                Stay consistent. Your transformation is the result of what you do every day.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/athlete/check-in">
                <Button className="w-full sm:w-auto h-12 px-8 font-bold uppercase tracking-widest shadow-lg shadow-primary/20 group">
                  Submit Check-In
                  <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/athlete/messages">
                <Button variant="outline" className="w-full sm:w-auto h-12 px-8 font-bold uppercase tracking-widest backdrop-blur-sm">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Coach Messenger
                </Button>
              </Link>
            </div>
          </div>

          {user?.nextShowName && user.nextShowDate && (
            <div className="mt-8 pt-6 border-t border-primary/10 flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Contest Countdown</span>
                <span className="text-lg font-bold text-primary tracking-tight">
                  {user.nextShowName} • {formatDistanceToNow(new Date(user.nextShowDate), { addSuffix: false })} to go
                </span>
              </div>
              <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden hidden sm:block">
                <div className="h-full bg-primary w-2/3 shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Nutrition Card */}
          <Card className="border-border/50 bg-card hover:border-primary/30 transition-colors shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 space-y-4 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-xl flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-primary" />
                  Daily Nutrition
                </h3>
                {currentNutritionPlan && (
                  <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase">Target Set</span>
                )}
              </div>

              {currentNutritionPlan ? (
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="bg-secondary/20 p-3 rounded-lg border border-border/30">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Protein</p>
                    <p className="text-lg font-bold font-display">{currentNutritionPlan.proteinG}g</p>
                  </div>
                  <div className="bg-secondary/20 p-3 rounded-lg border border-border/30">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Carbs</p>
                    <p className="text-lg font-bold font-display">{currentNutritionPlan.carbsG}g</p>
                  </div>
                  <div className="bg-secondary/20 p-3 rounded-lg border border-border/30">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Fats</p>
                    <p className="text-lg font-bold font-display">{currentNutritionPlan.fatsG}g</p>
                  </div>
                  <div className="bg-primary/5 p-3 rounded-lg border border-primary/20">
                    <p className="text-[10px] text-primary/80 uppercase font-bold tracking-wider">Calories</p>
                    <p className="text-lg font-bold font-display text-primary">{currentNutritionPlan.calories || (currentNutritionPlan.proteinG! * 4 + currentNutritionPlan.carbsG! * 4 + currentNutritionPlan.fatsG! * 9)}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center italic">No meal plan currently assigned.</p>
              )}
            </div>
            <div className="px-6 py-4 bg-secondary/10 border-t border-border/50">
              <Link href="/athlete/meal-plan">
                <Button variant="ghost" size="sm" className="w-full font-bold uppercase tracking-widest text-primary hover:text-primary hover:bg-primary/5">
                  View Full Protocol
                </Button>
              </Link>
            </div>
          </Card>

          {/* Training Card */}
          <Card className="border-border/50 bg-card hover:border-primary/30 transition-colors shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 space-y-4 flex-1">
              <h3 className="font-display font-bold text-xl flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Today's Training
              </h3>

              <div className="bg-secondary/20 rounded-xl p-4 border border-border/30 mt-4">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Workout Focus</p>
                <p className="text-lg font-bold font-display uppercase tracking-tight">
                  {todaysPlan ? todaysPlan.focus || "Weights Session" : "Active Recovery / Rest"}
                </p>
                {todaysPlan && (
                  <p className="text-xs text-muted-foreground mt-1">Day {format(new Date(), 'EEEE')}</p>
                )}
              </div>

              {todaysPlan && (
                <div className="mt-6">
                  <label className={`flex items-center gap-3 rounded-xl border p-4 transition-all cursor-pointer group ${todaysCompletion?.completed ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-secondary/40 border-border/50 hover:border-primary/50'}`}>
                    <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${todaysCompletion?.completed ? 'bg-emerald-500 border-emerald-500' : 'border-muted-foreground group-hover:border-primary'}`}>
                      {todaysCompletion?.completed && <ClipboardCheck className="w-4 h-4 text-white" />}
                    </div>
                    <input
                      type="checkbox"
                      className="hidden"
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
                    <span className="text-sm font-bold uppercase tracking-wide">
                      {todaysCompletion?.completed ? 'Workout Completed' : 'Mark as Complete'}
                    </span>
                  </label>
                </div>
              )}
            </div>
            <div className="px-6 py-4 bg-secondary/10 border-t border-border/50">
              <Link href="/athlete/workout-plan">
                <Button variant="ghost" size="sm" className="w-full font-bold uppercase tracking-widest text-primary hover:text-primary hover:bg-primary/5">
                  Full Workout Library
                </Button>
              </Link>
            </div>
          </Card>

          {/* Progress Card */}
          <Card className="border-border/50 bg-card hover:border-primary/30 transition-colors shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 space-y-4 flex-1">
              <h3 className="font-display font-bold text-xl flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Latest Metrics
              </h3>

              {last ? (
                <div className="space-y-4 mt-4">
                  <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg border border-border/30">
                    <span className="text-xs text-muted-foreground font-bold uppercase">Morning Weight</span>
                    <span className="text-lg font-bold font-display text-primary">{last.weight}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg border border-border/30">
                    <span className="text-xs text-muted-foreground font-bold uppercase">Sleep Quality</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className={`w-3 h-1.5 rounded-full ${i <= (last.sleep || 0) / 2 ? 'bg-primary' : 'bg-muted'}`} />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg border border-border/30">
                    <span className="text-xs text-muted-foreground font-bold uppercase">Stress Level</span>
                    <span className="text-xs font-bold uppercase">{last.stress}/10</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-muted-foreground opacity-20 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground italic">No metrics logged this week.</p>
                </div>
              )}
            </div>
            <div className="px-6 py-4 bg-secondary/10 border-t border-border/50">
              <Link href="/athlete/history">
                <Button variant="ghost" size="sm" className="w-full font-bold uppercase tracking-widest text-primary hover:text-primary hover:bg-primary/5">
                  View Full History
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </LayoutAthlete>
  );
}

import { ChevronRight } from "lucide-react";
