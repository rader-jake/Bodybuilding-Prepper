import LayoutAthlete from "@/components/LayoutAthlete";
import { useAuth } from "@/hooks/use-auth";
import { useCheckins } from "@/hooks/use-checkins";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow, format } from "date-fns";
import { Link } from "wouter";
import { useNutritionPlans, useWeeklyTrainingPlans, useTrainingCompletions } from "@/hooks/use-plans";
import { Activity, BarChart3, CalendarDays, ClipboardCheck, MessageSquare, Utensils, ChevronRight, Info } from "lucide-react";
import { TooltipHelper } from "@/components/ui/TooltipHelper";
import { PREFERENCES_KEYS } from "@/lib/preferences";
import { EmptyState } from "@/components/ui/EmptyState";

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

  // Logic for "Start Here" Banner
  const hasEverCheckedIn = checkins && checkins.length > 0;

  return (
    <LayoutAthlete>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* "Start Here" Banner - Show only if no check-ins yet */}
        {!isLoading && !hasEverCheckedIn && (
          <div className="glass-panel rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl mb-12 animate-in fade-in slide-in-from-top-4 duration-1000">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-2xl shadow-xl rotate-3">1</div>
              <div>
                <h3 className="text-xl font-display font-bold text-primary">Let's set your baseline</h3>
                <p className="text-muted-foreground max-w-sm">Complete your first check-in to give your coach the initial data they need to adjust your plan.</p>
              </div>
            </div>
            <Link href="/athlete/check-in">
              <Button className="btn-primary w-full md:w-auto h-14 px-8 group">
                Start Check-In <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        )}

        <div className="card-premium relative overflow-hidden p-8 sm:p-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />

          <div className="relative z-10 flex flex-col md:items-center md:flex-row justify-between gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-[0.2em] border border-primary/20">
                  {user?.currentPhase || "Pre-Season"}
                </span>
                <span className="label-caps opacity-60">Phase</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-display font-bold tracking-tight leading-none">
                Welcome, <span className="text-primary">{user?.displayName || user?.username}</span>
              </h2>
              <p className="text-ml-text-muted text-lg max-w-lg leading-relaxed">
                Stay consistent. Your transformation is the result of what you do every single day.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <TooltipHelper preferenceKey={PREFERENCES_KEYS.HAS_SEEN_DASHBOARD_TOOLTIP} content="Tap here weekly to update your weight, photos, and biofeedback for your coach." side="bottom">
                <Link href="/athlete/check-in">
                  <Button className="btn-primary w-full sm:w-auto h-14 px-10 group">
                    Weekly Check-In
                    <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </TooltipHelper>
              <Link href="/athlete/messages">
                <Button variant="outline" className="w-full sm:w-auto h-14 px-8 font-bold uppercase tracking-widest backdrop-blur-sm border-white/10 hover:bg-white/5 rounded-full">
                  <MessageSquare className="w-5 h-5 mr-3" />
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Nutrition Card */}
          <div className="card-premium flex flex-col h-full group">
            <div className="space-y-6 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-2xl flex items-center gap-3">
                  <Utensils className="w-6 h-6 text-primary" />
                  Nutrition
                </h3>
                {currentNutritionPlan && (
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-widest border border-primary/20">Target Set</span>
                )}
              </div>

              {currentNutritionPlan ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/[0.03]">
                    <p className="label-caps mb-2">Protein</p>
                    <p className="text-2xl font-display font-bold leading-none">{currentNutritionPlan.proteinG}g</p>
                  </div>
                  <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/[0.03]">
                    <p className="label-caps mb-2">Carbs</p>
                    <p className="text-2xl font-display font-bold leading-none">{currentNutritionPlan.carbsG}g</p>
                  </div>
                  <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/[0.03]">
                    <p className="label-caps mb-2">Fats</p>
                    <p className="text-2xl font-display font-bold leading-none">{currentNutritionPlan.fatsG}g</p>
                  </div>
                  <div className="bg-primary/10 p-4 rounded-2xl border border-primary/20">
                    <p className="label-caps mb-2 text-primary">Calories</p>
                    <p className="text-2xl font-display font-bold text-primary leading-none">
                      {currentNutritionPlan.calories || (currentNutritionPlan.proteinG! * 4 + currentNutritionPlan.carbsG! * 4 + currentNutritionPlan.fatsG! * 9)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-8 bg-white/[0.02] rounded-2xl border border-white/[0.03] flex flex-col items-center justify-center text-center px-4">
                  <Utensils className="w-10 h-10 text-white/10 mb-4" />
                  <p className="text-sm font-bold text-white/40 uppercase tracking-widest">No Plan Assigned</p>
                </div>
              )}
            </div>
            {currentNutritionPlan && (
              <div className="mt-8 pt-6 border-t border-white/[0.05]">
                <Link href="/athlete/meal-plan">
                  <Button variant="ghost" className="w-full h-12 font-bold uppercase tracking-widest text-primary hover:bg-primary/5 rounded-xl flex items-center justify-between">
                    Full Protocol
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Training Card */}
          <div className="card-premium flex flex-col h-full group">
            <div className="space-y-6 flex-1">
              <h3 className="font-display font-bold text-2xl flex items-center gap-3">
                <Activity className="w-6 h-6 text-primary" />
                Training
              </h3>

              <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.03] space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="label-caps mb-2 opacity-60">Today's Focus</p>
                    <p className="text-2xl font-display font-bold uppercase tracking-tight leading-none">
                      {todaysPlan ? todaysPlan.focus || "Weights Session" : "Active Recovery"}
                    </p>
                  </div>
                  {todaysPlan && <span className="label-caps opacity-40">{format(new Date(), 'EEE')}</span>}
                </div>
              </div>

              {todaysPlan && (
                <div className="mt-6">
                  <label className={`flex items-center gap-4 rounded-2xl border p-5 transition-all cursor-pointer group/item ${todaysCompletion?.completed ? 'bg-primary/10 border-primary/30' : 'bg-white/[0.02] border-white/[0.05] hover:border-primary/50'}`}>
                    <div className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all ${todaysCompletion?.completed ? 'bg-primary border-primary' : 'border-white/20 group-hover/item:border-primary'}`}>
                      {todaysCompletion?.completed && <ClipboardCheck className="w-5 h-5 text-ml-bg" />}
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
                    <span className="text-sm font-bold uppercase tracking-widest">
                      {todaysCompletion?.completed ? 'Completed' : 'Submit Done'}
                    </span>
                  </label>
                </div>
              )}
            </div>
            <div className="mt-8 pt-6 border-t border-white/[0.05]">
              <Link href="/athlete/workout-plan">
                <Button variant="ghost" className="w-full h-12 font-bold uppercase tracking-widest text-primary hover:bg-primary/5 rounded-xl flex items-center justify-between">
                  Full Library
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Progress Card */}
          <div className="card-premium flex flex-col h-full group">
            <div className="space-y-6 flex-1">
              <h3 className="font-display font-bold text-2xl flex items-center gap-3">
                <BarChart3 className="w-6 h-6 text-primary" />
                Progress
              </h3>

              {last ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-2xl border border-white/[0.03]">
                    <span className="label-caps opacity-60">Morning Weight</span>
                    <span className="text-2xl font-display font-bold text-primary">{last.weight}<span className="text-xs ml-1 opacity-40 font-sans">LBS</span></span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-2xl border border-white/[0.03]">
                    <span className="label-caps opacity-60">Feeling</span>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className={`w-4 h-2 rounded-full ${i <= (last.energy || 5) ? 'bg-primary' : 'bg-white/5'}`} />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 bg-white/[0.02] rounded-2xl border border-white/[0.03] flex flex-col items-center justify-center text-center px-4">
                  <Activity className="w-10 h-10 text-white/10 mb-4" />
                  <p className="text-sm font-bold text-white/40 uppercase tracking-widest">No Baseline Set</p>
                </div>
              )}
            </div>
            <div className="mt-8 pt-6 border-t border-white/[0.05]">
              <Link href="/athlete/history">
                <Button variant="ghost" className="w-full h-12 font-bold uppercase tracking-widest text-primary hover:bg-primary/5 rounded-xl flex items-center justify-between">
                  Full History
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </LayoutAthlete>
  );
}
