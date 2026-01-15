import LayoutAthlete from "@/components/LayoutAthlete";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useNutritionPlans } from "@/hooks/use-plans";
import { Utensils } from "lucide-react";

const mockMeals = [
  { day: 'Monday', protein: 200, carbs: 300, fats: 70, calories: 3000 },
  { day: 'Tuesday', protein: 200, carbs: 300, fats: 70, calories: 3000 },
  { day: 'Wednesday', protein: 180, carbs: 320, fats: 65, calories: 2950 },
];

export default function MealPlan() {
  const { user } = useAuth();
  const { nutritionPlans } = useNutritionPlans(user?.id);
  const planLink = user?.mealPlan ?? undefined;
  const hasPlanLink = !!planLink && planLink.startsWith("http");
  const currentPlan = nutritionPlans?.[0];

  return (
    <LayoutAthlete>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Utensils className="w-6 h-6 text-primary" />
          Meal Plan
        </h1>
        <Card>
          <CardContent>
            {hasPlanLink ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Your coach shared a meal plan document.</p>
                <a href={planLink} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">
                  Open meal plan
                </a>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  {currentPlan ? "Current weekly macros provided by your coach." : "Placeholder daily macros. Connect to coach-created plans later."}
                </p>
                <div className="mt-4 grid gap-3">
                  {(currentPlan
                    ? [
                        {
                          day: currentPlan.weekStartDate ? new Date(currentPlan.weekStartDate).toLocaleDateString() : "This Week",
                          protein: currentPlan.proteinG || 0,
                          carbs: currentPlan.carbsG || 0,
                          fats: currentPlan.fatsG || 0,
                          calories: currentPlan.calories || 0,
                        },
                      ]
                    : mockMeals
                  ).map((m) => (
                    <div key={m.day} className="p-4 rounded border border-border bg-background flex justify-between items-center">
                      <div>
                        <div className="font-bold">{m.day}</div>
                        <div className="text-sm text-muted-foreground">Protein {m.protein}g • Carbs {m.carbs}g • Fats {m.fats}g</div>
                      </div>
                      <div className="text-sm font-mono font-bold">{m.calories} kcal</div>
                    </div>
                  ))}
                </div>
                {currentPlan?.notes && (
                  <div className="mt-4 text-sm text-muted-foreground">{currentPlan.notes}</div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </LayoutAthlete>
  );
}
