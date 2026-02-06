import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dumbbell, Flame, Zap, Wind } from "lucide-react";
import { useState } from "react";
import { Redirect, useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiFetch";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

type Industry = "bodybuilding" | "powerlifting" | "endurance" | "crossfit";

const INDUSTRIES = [
  {
    id: "bodybuilding" as Industry,
    name: "Bodybuilding",
    description: "Physique, posing, competition prep",
    icon: Dumbbell,
    color: "from-orange-500 to-red-500",
  },
  {
    id: "powerlifting" as Industry,
    name: "Powerlifting",
    description: "Squat, bench, deadlift, max strength",
    icon: Flame,
    color: "from-red-500 to-orange-500",
  },
  {
    id: "endurance" as Industry,
    name: "Endurance",
    description: "Triathlon, running, cycling, swimming",
    icon: Wind,
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "crossfit" as Industry,
    name: "CrossFit",
    description: "Functional fitness, workouts, mixed modality",
    icon: Zap,
    color: "from-purple-500 to-pink-500",
  },
];

export default function CoachOnboarding() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selected, setSelected] = useState<Industry | null>(null);

  // Redirect if not a coach or already has industry set
  if (!user || user.role !== "coach") {
    return <Redirect to="/" />;
  }

  if (user.coachIndustry) {
    return <Redirect to="/dashboard" />;
  }

  const updateMutation = useMutation({
    mutationFn: async (industry: Industry) => {
      const response = await apiFetch<{ user: any }>(api.auth.update.path, {
        method: api.auth.update.method,
        body: JSON.stringify({ coachIndustry: industry }),
      });
      return response;
    },
    onSuccess: (data) => {
      queryClient.setQueryData([api.auth.me.path], data.user);
      toast({
        title: "Industry Selected",
        description: `Your workspace is now set to ${selected?.charAt(0).toUpperCase()}${selected?.slice(1)}.`,
      });
      setLocation("/dashboard");
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const handleSelect = (industry: Industry) => {
    setSelected(industry);
    updateMutation.mutate(industry);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-secondary via-background to-background p-4">
      <div className="w-full max-w-4xl">
        <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-2xl shadow-black/40">
          <CardHeader className="text-center space-y-4 pb-8">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_30px_-10px_rgba(var(--primary),0.4)]">
              <Dumbbell className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-display uppercase tracking-tight">Select Your Industry</CardTitle>
              <CardDescription className="text-lg text-muted-foreground">
                Choose the training focus for your coaching workspace. Your athletes will inherit this, and all features will be tailored accordingly.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {INDUSTRIES.map((industry) => {
                const IconComponent = industry.icon;
                const isSelected = selected === industry.id;
                return (
                  <button
                    key={industry.id}
                    onClick={() => handleSelect(industry.id)}
                    disabled={updateMutation.isPending}
                    className={`relative p-6 rounded-2xl border-2 transition-all duration-300 group ${
                      isSelected
                        ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                        : "border-border/50 hover:border-primary/50 bg-secondary/20 hover:bg-secondary/40"
                    } ${updateMutation.isPending ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <div className="space-y-4 text-left">
                      <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${industry.color} shadow-lg`}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold tracking-tight">{industry.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{industry.description}</p>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="mt-4 flex items-center justify-center text-xs font-bold text-primary uppercase tracking-widest">
                        {updateMutation.isPending ? "Setting up..." : "Selected"}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-muted-foreground text-center mt-8">
              This setting cannot be changed after onboarding. Contact support if needed.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
