import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { preferences, PREFERENCES_KEYS } from "@/lib/preferences";
import { useAuth } from "@/hooks/use-auth";
import { ChevronRight, CheckCircle2, ClipboardList, MessageSquare } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { apiFetch } from "@/lib/apiFetch";
import { type SportType } from "@/lib/templates";
import { useLocation } from "wouter";

export function OnboardingModal() {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState(1);
    const [selectedSport, setSelectedSport] = useState<SportType>("bodybuilding");
    const { user } = useAuth();
    const [, setLocation] = useLocation();
    const queryClient = useQueryClient();

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
        if (isCoach && step === 2) return;
        handleComplete();
    };

    const handleAction = (path: string) => {
        handleComplete();
        setLocation(path);
    };

    const handleNext = async () => {
        if (user?.role === "coach" && step === 1) {
            setStep(2); // Go to sport selection
        } else if (user?.role === "coach" && step === 2) {
            // Save sport selection
            try {
                await apiFetch(api.auth.update.path, {
                    method: 'PATCH',
                    body: JSON.stringify({ sport: selectedSport })
                });
                // Update local user cache so dashboard updates immediately
                queryClient.invalidateQueries({ queryKey: [api.auth.me.path] });
                setStep(3);
            } catch (e) {
                console.error("Failed to save sport", e);
                setStep(3); // Proceed anyway
            }
        } else {
            // Athlete or Coach final step
            setStep(prev => prev + 1);
        }
    };

    // Determine total steps
    const totalSteps = user?.role === "coach" ? 3 : 2;

    if (!user) return null;

    const isCoach = user.role === "coach";

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!val && isCoach && step === 2) return;
            if (!val) handleSkip();
        }}>
            <DialogContent className="sm:max-w-md bg-card border-border">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold tracking-tight text-primary">
                        Welcome to MetaLifts
                    </DialogTitle>
                    <DialogDescription className="text-base text-muted-foreground">
                        {step === 1 && "Let's get you set up in under 30 seconds."}
                        {step === 2 && user?.role === "coach" && "Which sport do you primarily coach?"}
                        {step === totalSteps && "You're all set to go."}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6">
                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="flex items-start gap-4 p-4 rounded-lg bg-secondary/10 border border-border/50">
                                <div className="p-2 bg-primary/10 rounded-full text-primary">
                                    {isCoach ? <ClipboardList className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
                                </div>
                                <div className="space-y-1">
                                    <h4 className="font-bold text-foreground">
                                        {isCoach ? "Review Check-Ins" : "Weekly Check-Ins"}
                                    </h4>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {isCoach
                                            ? "The dashboard highlights athletes who need your attention today."
                                            : "Submit photos and metrics so your coach can adjust your plan."}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 rounded-lg bg-secondary/10 border border-border/50">
                                <div className="p-2 bg-primary/10 rounded-full text-primary">
                                    <MessageSquare className="w-6 h-6" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="font-bold text-foreground">Direct Messaging</h4>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        Keep all communication in one place. No more lost texts or emails.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && isCoach && (
                        <div className="grid grid-cols-2 gap-3">
                            {(['bodybuilding', 'powerlifting', 'crossfit', 'endurance', 'hybrid'] as SportType[]).map((sport) => (
                                <div
                                    key={sport}
                                    onClick={() => setSelectedSport(sport)}
                                    className={`
                                        cursor-pointer p-3 rounded-lg border-2 text-center transition-all
                                        ${selectedSport === sport
                                            ? "border-primary bg-primary/10 text-primary font-bold shadow-sm"
                                            : "border-transparent bg-secondary/20 hover:bg-secondary/40 text-muted-foreground"}
                                    `}
                                >
                                    <div className="capitalize">{sport}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {step === totalSteps && (
                        <div className="text-center space-y-4 py-4">
                            <div className="mx-auto w-16 h-16 bg-primary/20 text-primary rounded-full flex items-center justify-center mb-4">
                                <CheckCircle2 className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold">Ready to crush it?</h3>
                            <p className="text-muted-foreground">
                                {isCoach
                                    ? "Head to your dashboard to see who's checking in today."
                                    : "Complete your first check-in now to establish your baseline."}
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    {step < totalSteps ? (
                        <>
                            {!(isCoach && step === 2) && (
                                <Button variant="ghost" onClick={handleSkip} className="w-full sm:w-auto">
                                    Skip
                                </Button>
                            )}
                            <Button onClick={handleNext} className="w-full sm:w-auto font-bold uppercase tracking-wider">
                                Next <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                        </>
                    ) : (
                        <Button
                            onClick={() => handleAction(isCoach ? "/dashboard" : "/athlete/check-in")}
                            className="w-full font-bold uppercase tracking-wider shadow-lg shadow-primary/20"
                        >
                            {isCoach ? "Go to Dashboard" : "Start First Check-In"}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
