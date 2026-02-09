import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { preferences, PREFERENCES_KEYS } from "@/lib/preferences";
import { useAuth } from "@/hooks/use-auth";
import {
    ChevronRight,
    CheckCircle2,
    ClipboardList,
    MessageSquare,
    UserPlus,
    TrendingUp,
    Utensils
} from "lucide-react";
import { useLocation } from "wouter";
import { getSportTypeForUser } from "@/lib/sport-configs";

export function OnboardingModal() {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState(1);
    const { user } = useAuth();
    const [, setLocation] = useLocation();

    useEffect(() => {
        if (!user) return;

        // slight delay to not jar the user immediately on load
        const timer = setTimeout(() => {
            const key = `${PREFERENCES_KEYS.HAS_SEEN_ONBOARDING}_${user.id}`;
            const hasSeen = preferences.get(key);
            if (!hasSeen) {
                setOpen(true);
            }
        }, 1500);
        return () => clearTimeout(timer);
    }, [user]);

    const handleComplete = () => {
        if (user) {
            const key = `${PREFERENCES_KEYS.HAS_SEEN_ONBOARDING}_${user.id}`;
            preferences.set(key, true);
        }
        setOpen(false);
    };

    const handleSkip = () => {
        handleComplete();
    };

    const handleAction = (path: string) => {
        handleComplete();
        setLocation(path);
    };

    const handleNext = () => {
        setStep(prev => prev + 1);
    };

    // Determine total steps - simplified to 2 steps (Tips -> Ready)
    const totalSteps = 2;

    if (!user) return null;

    const isCoach = user.role === "coach";
    const industry = isCoach ? user.coachIndustry : (user as any).effectiveIndustry;

    // Do not show modal if industry is missing for athletes
    if (user.role === "athlete" && !industry) return null;

    const getIndustryKPIs = (ind: string) => {
        switch (ind) {
            case 'bodybuilding':
                return "Track posing photo progression (mandatories), scale weight trends, and key body measurements like waist size.";
            case 'powerlifting':
                return "Monitor Squat, Bench, and Deadlift top working sets (weight × reps) plus estimated 1RM progress.";
            case 'endurance':
                return "Keep an eye on weekly swim, bike, and run distance volume to manage fatigue and performance.";
            case 'crossfit':
                return "Review benchmark performances and monitor workout volume across varied modalities.";
            default:
                return "Track performance metrics, body metrics, and progress photos tailored to your coaching style.";
        }
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!val) handleSkip();
        }}>
            <DialogContent className="sm:max-w-lg bg-card border-border shadow-2xl">
                <DialogHeader className="space-y-3">
                    <DialogTitle className="text-3xl font-bold tracking-tight text-primary">
                        {isCoach ? "Coach Quick Start" : "Welcome to MetaLifts"}
                    </DialogTitle>
                    <DialogDescription className="text-base text-muted-foreground">
                        {step === 1 && (isCoach ? "Everything you need to manage your team effectively." : "Let's get you set up in under 30 seconds.")}
                        {step === totalSteps && "You're all set to go."}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {step === 1 && (
                        <div className="space-y-4">
                            {isCoach ? (
                                <>
                                    <div className="flex items-start gap-4 p-4 rounded-xl bg-primary/5 border border-primary/10 transition-colors hover:bg-primary/10">
                                        <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
                                            <UserPlus className="w-5 h-5" />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="font-bold text-foreground">Add & Invite Athletes</h4>
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                Invite athletes via registration link. Once they join, they'll appear on your dashboard automatically.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4 p-4 rounded-xl bg-primary/5 border border-primary/10 transition-colors hover:bg-primary/10">
                                        <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
                                            <TrendingUp className="w-5 h-5" />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="font-bold text-foreground">Track Industry KPIs</h4>
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                {getIndustryKPIs(industry)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4 p-4 rounded-xl bg-primary/5 border border-primary/10 transition-colors hover:bg-primary/10">
                                        <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
                                            <ClipboardList className="w-5 h-5" />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="font-bold text-foreground">Review Weekly Check-Ins</h4>
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                Athletes submit data weekly. Review trends and use data-driven insights to adjust training and nutrition.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4 p-4 rounded-xl bg-primary/5 border border-primary/10 transition-colors hover:bg-primary/10">
                                        <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
                                            <Utensils className="w-5 h-5" />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="font-bold text-foreground">Nutrition & Protocols</h4>
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                Attach detailed nutrition protocols or link external plans directly to each athlete's profile.
                                            </p>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex items-start gap-4 p-4 rounded-xl bg-primary/5 border border-primary/10">
                                        <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
                                            <CheckCircle2 className="w-5 h-5" />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="font-bold text-foreground">Weekly Check-Ins</h4>
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                Submit photos and metrics over time so your coach can refine your plan.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4 p-4 rounded-xl bg-primary/5 border border-primary/10">
                                        <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
                                            <MessageSquare className="w-5 h-5" />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="font-bold text-foreground">Direct Messaging</h4>
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                Keep all communication in one dashboard. No more lost texts or confusing email threads.
                                            </p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {step === totalSteps && (
                        <div className="text-center space-y-6 py-10">
                            <div className="mx-auto w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4 border border-primary/20 shadow-xl shadow-primary/10">
                                <CheckCircle2 className="w-10 h-10" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold tracking-tight">Ready to crush it?</h3>
                                <p className="text-muted-foreground text-lg">
                                    {isCoach
                                        ? "Head to your dashboard to start managing your team."
                                        : "Complete your first check-in now to establish your baseline."}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-3 mt-6">
                    {step < totalSteps ? (
                        <>
                            <Button variant="outline" onClick={handleSkip} className="w-full sm:w-auto border-border hover:bg-secondary/50">
                                Skip
                            </Button>
                            <Button onClick={handleNext} className="w-full sm:flex-1 font-bold uppercase tracking-widest bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 h-12">
                                Next Step <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                        </>
                    ) : (
                        <Button
                            onClick={() => handleAction(isCoach ? "/dashboard" : "/athlete/check-in")}
                            className="w-full font-bold uppercase tracking-widest shadow-xl shadow-primary/20 h-14 text-lg bg-primary hover:bg-primary/90"
                        >
                            {isCoach ? "Go to Dashboard" : "Start First Check-In"}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>

    );
}

