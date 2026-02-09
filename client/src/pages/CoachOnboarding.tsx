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
type BillingMode = "platform" | "external";
type Step = "industry" | "billing";

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

const BILLING_MODES = [
    {
        id: "platform" as BillingMode,
        name: "MetaLifts Managed",
        description: "We handle all subscriptions, payments, and payouts via Stripe automatically.",
        icon: Zap,
        color: "from-indigo-500 to-purple-500",
    },
    {
        id: "external" as BillingMode,
        name: "External Billing",
        description: "You collect payments from athletes manually. You control athlete access directly.",
        icon: Dumbbell,
        color: "from-slate-500 to-slate-700",
    }
];

export default function CoachOnboarding() {
    const { user } = useAuth();
    const [, setLocation] = useLocation();
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [step, setStep] = useState<Step>("industry");
    const [selectedIndustry, setSelectedIndustry] = useState<Industry | null>(null);
    const [selectedBilling, setSelectedBilling] = useState<BillingMode | null>(null);

    // Redirect if not a coach or already has industry set
    if (!user || user.role !== "coach") {
        return <Redirect to="/" />;
    }

    if (user.coachIndustry && user.billingMode) {
        return <Redirect to="/dashboard" />;
    }

    const updateMutation = useMutation({
        mutationFn: async (vars: { industry: Industry; billing: BillingMode }) => {
            const response = await apiFetch<{ user: any }>(api.auth.update.path, {
                method: api.auth.update.method,
                body: JSON.stringify({
                    coachIndustry: vars.industry,
                    billingMode: vars.billing
                }),
            });
            return response;
        },
        onSuccess: (data) => {
            const updatedUser = data.user || data;
            queryClient.setQueryData([api.auth.me.path], updatedUser);
            toast({
                title: "Setup Complete",
                description: `Your workspace is ready.`,
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

    const handleIndustrySelect = (industry: Industry) => {
        setSelectedIndustry(industry);
        setStep("billing");
    };

    const handleBillingSelect = (billing: BillingMode) => {
        if (!selectedIndustry) return;
        setSelectedBilling(billing);
        updateMutation.mutate({ industry: selectedIndustry, billing });
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-secondary via-background to-background p-4">
            <div className="w-full max-w-4xl">
                <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-2xl shadow-black/40">
                    <CardHeader className="text-center space-y-4 pb-8">
                        <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_30px_-10px_rgba(var(--primary),0.4)]">
                            {step === "industry" ? <Dumbbell className="w-8 h-8 text-primary" /> : <Zap className="w-8 h-8 text-primary" />}
                        </div>
                        <div className="space-y-2">
                            <CardTitle className="text-3xl font-display uppercase tracking-tight">
                                {step === "industry" ? "Select Your Industry" : "Choose Billing Mode"}
                            </CardTitle>
                            <CardDescription className="text-lg text-muted-foreground">
                                {step === "industry"
                                    ? "Choose the training focus for your coaching workspace."
                                    : "Decide how you'll collect payments from your athletes."}
                            </CardDescription>
                        </div>
                    </CardHeader>

                    <CardContent>
                        {step === "industry" ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {INDUSTRIES.map((industry) => {
                                    const IconComponent = industry.icon;
                                    const isSelected = selectedIndustry === industry.id;
                                    return (
                                        <button
                                            key={industry.id}
                                            onClick={() => handleIndustrySelect(industry.id)}
                                            className={`relative p-6 rounded-2xl border-2 transition-all duration-300 group ${isSelected
                                                ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                                                : "border-border/50 hover:border-primary/50 bg-secondary/20 hover:bg-secondary/40"
                                                } cursor-pointer`}
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
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {BILLING_MODES.map((mode) => {
                                    const IconComponent = mode.icon;
                                    const isSelected = selectedBilling === mode.id;
                                    return (
                                        <button
                                            key={mode.id}
                                            onClick={() => handleBillingSelect(mode.id)}
                                            disabled={updateMutation.isPending}
                                            className={`relative p-6 rounded-2xl border-2 transition-all duration-300 group ${isSelected
                                                ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                                                : "border-border/50 hover:border-primary/50 bg-secondary/20 hover:bg-secondary/40"
                                                } ${updateMutation.isPending ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                                        >
                                            <div className="space-y-4 text-left">
                                                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${mode.color} shadow-lg`}>
                                                    <IconComponent className="w-6 h-6 text-white" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold tracking-tight">{mode.name}</h3>
                                                    <p className="text-sm text-muted-foreground mt-1">{mode.description}</p>
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
                        )}

                        <div className="flex justify-between items-center mt-8">
                            {step === "billing" && (
                                <Button variant="ghost" onClick={() => setStep("industry")} disabled={updateMutation.isPending}>
                                    Back to Industry
                                </Button>
                            )}
                            <p className="text-xs text-muted-foreground text-center flex-1">
                                These settings can be adjusted in your profile later.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
