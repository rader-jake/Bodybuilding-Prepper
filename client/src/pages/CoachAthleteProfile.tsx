import { useAuth } from "@/hooks/use-auth";
import { useAthletes } from "@/hooks/use-athletes";
import { useToast } from "@/hooks/use-toast";
import { useCheckins } from "@/hooks/use-checkins";
import { useHealthMarkers, useNutritionPlans, useProtocols, useTrainingBlocks, useWeeklyTrainingPlans, useTrainingCompletions } from "@/hooks/use-plans";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Link as LinkIcon, HeartPulse, ShieldAlert, ClipboardList, Target, CalendarDays, MessageSquare } from "lucide-react";
import { api } from "@shared/routes";
import { useEffect, useState } from "react";
import { format, differenceInDays } from "date-fns";
import { Redirect, useLocation, useRoute } from "wouter";
import { POSE_KEYS } from "@/lib/poses";
import { SPORT_CHECKIN_CONFIGS, SPORT_EVENT_LABELS, SPORT_LABELS, SPORT_PROFILE_CONFIGS, getSportTypeForUser } from "@/lib/sport-configs";
import { formatMetricValue, getCheckinMetricValue } from "@/lib/checkin-utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { SportType } from "@shared/types";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiFetch";

export default function CoachAthleteProfile() {
  const { user } = useAuth();
  const { athletes, isLoading, updateAthlete, deleteAthlete } = useAthletes();
  const { toast } = useToast();
  const [, params] = useRoute("/dashboard/athletes/:id");
  const [, setLocation] = useLocation();

  const athleteId = Number(params?.id);
  const athlete = athletes?.find((item) => item.id === athleteId);

  const sportType = getSportTypeForUser(athlete || null);
  const profileConfig = SPORT_PROFILE_CONFIGS[sportType];
  const checkinConfig = SPORT_CHECKIN_CONFIGS[sportType];

  const { data: coachBilling } = useQuery({
    queryKey: [api.billing.coachSummary.path],
    queryFn: async () => {
      return await apiFetch<{
        totalRevenueCents: number;
        mrrCents: number;
        perAthlete: Array<{
          athleteId: number;
          athleteName: string;
          currentAmountCents: number | null;
          paymentStatus: string | null;
          locked: boolean | null;
          lastPaidAt: string | null;
        }>;
      }>(api.billing.coachSummary.path);
    },
    enabled: !!user,
  });

  const billingForAthlete = coachBilling?.perAthlete.find((row) => row.athleteId === athleteId);
  const { checkins } = useCheckins(athleteId);
  const { trainingBlocks, createTrainingBlock } = useTrainingBlocks(athleteId);
  const { weeklyPlans, createWeeklyPlan } = useWeeklyTrainingPlans(athleteId);
  const { nutritionPlans, createNutritionPlan } = useNutritionPlans(athleteId);
  const { protocols, createProtocol } = useProtocols(athleteId);
  const { healthMarkers, createHealthMarker } = useHealthMarkers(athleteId);
  const todayKey = format(new Date(), "yyyy-MM-dd");
  const todayLabel = format(new Date(), "EEEE");
  const { completions } = useTrainingCompletions(athleteId, todayKey);

  const [workoutPlanUrl, setWorkoutPlanUrl] = useState<string>(athlete?.workoutPlan || "");
  const [mealPlanUrl, setMealPlanUrl] = useState<string>(athlete?.mealPlan || "");
  const [isUploadingWorkout, setIsUploadingWorkout] = useState(false);
  const [isUploadingMeal, setIsUploadingMeal] = useState(false);
  const [newBlockName, setNewBlockName] = useState("");
  const [newBlockFocus, setNewBlockFocus] = useState("");
  const [newBlockNotes, setNewBlockNotes] = useState("");
  const [weeklyPlanText, setWeeklyPlanText] = useState("");
  const [macroProtein, setMacroProtein] = useState("");
  const [macroCarbs, setMacroCarbs] = useState("");
  const [macroFats, setMacroFats] = useState("");
  const [macroCalories, setMacroCalories] = useState("");
  const [macroNotes, setMacroNotes] = useState("");
  const [protocolType, setProtocolType] = useState<"supplement" | "compound">("supplement");
  const [protocolName, setProtocolName] = useState("");
  const [protocolDose, setProtocolDose] = useState("");
  const [protocolFrequency, setProtocolFrequency] = useState("");
  const [healthRestingHr, setHealthRestingHr] = useState("");
  const [healthBpSys, setHealthBpSys] = useState("");
  const [healthBpDia, setHealthBpDia] = useState("");
  const [healthScore, setHealthScore] = useState("");
  const [healthNotes, setHealthNotes] = useState("");
  const [selectedPose, setSelectedPose] = useState(POSE_KEYS[0].key);
  const [profileDraft, setProfileDraft] = useState<Record<string, any>>(athlete?.profile || {});
  const [showExperimental, setShowExperimental] = useState(false);
  const [monthlyFee, setMonthlyFee] = useState("");
  const [showName, setShowName] = useState(athlete?.nextShowName || "");
  const [showDate, setShowDate] = useState(
    athlete?.nextShowDate ? format(new Date(athlete.nextShowDate), "yyyy-MM-dd") : ""
  );
  const [phaseSelection, setPhaseSelection] = useState(athlete?.currentPhase || "off-season");

  useEffect(() => {
    if (athlete) {
      setWorkoutPlanUrl(athlete.workoutPlan || "");
      setMealPlanUrl(athlete.mealPlan || "");
      setShowName(athlete.nextShowName || "");
      setShowDate(athlete.nextShowDate ? format(new Date(athlete.nextShowDate), "yyyy-MM-dd") : "");
      setPhaseSelection(athlete.currentPhase || "off-season");
      setProfileDraft((athlete.profile as Record<string, any>) || {});
    }
  }, [athlete]);

  useEffect(() => {
    if (billingForAthlete?.currentAmountCents != null) {
      setMonthlyFee((billingForAthlete.currentAmountCents / 100).toFixed(0));
    }
  }, [billingForAthlete]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-6 py-10 space-y-6">
          <Button variant="ghost" onClick={() => setLocation("/dashboard")}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to dashboard
          </Button>
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Loading athlete profile...
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!athlete) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-6 py-10 space-y-6">
          <Button variant="ghost" onClick={() => setLocation("/dashboard")}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to dashboard
          </Button>
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Athlete not found.
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const handleDeleteAthlete = () => {
    const confirmed = window.confirm(`Delete ${athlete.displayName || athlete.username}? This will remove their check-ins and history.`);
    if (!confirmed) return;
    deleteAthlete.mutate(athlete.id, {
      onSuccess: () => {
        toast({ title: "Athlete deleted", description: "All athlete data removed." });
        setLocation("/dashboard");
      },
    });
  };

  const uploadPlan = async (file: File) => {
    const signatureRes = await fetch(api.cloudinary.sign.path, {
      method: api.cloudinary.sign.method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder: "plans" }),
    });
    if (!signatureRes.ok) throw new Error("Failed to prepare upload");
    const { signature, timestamp, cloudName, apiKey } = await signatureRes.json();
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", apiKey);
    formData.append("timestamp", String(timestamp));
    formData.append("signature", signature);
    formData.append("folder", "plans");
    const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`, {
      method: "POST",
      body: formData,
    });
    if (!uploadRes.ok) throw new Error("Upload failed");
    const uploadData = await uploadRes.json();
    return uploadData.secure_url as string;
  };

  const handleUploadWorkout = async (file: File) => {
    setIsUploadingWorkout(true);
    try {
      const url = await uploadPlan(file);
      setWorkoutPlanUrl(url);
    } finally {
      setIsUploadingWorkout(false);
    }
  };

  const handleUploadMeal = async (file: File) => {
    setIsUploadingMeal(true);
    try {
      const url = await uploadPlan(file);
      setMealPlanUrl(url);
    } finally {
      setIsUploadingMeal(false);
    }
  };

  const handleSavePlans = () => {
    updateAthlete.mutate({
      id: athlete.id,
      workoutPlan: workoutPlanUrl || null,
      mealPlan: mealPlanUrl || null,
    });
  };

  const handleSaveProfile = () => {
    updateAthlete.mutate({
      id: athlete.id,
      profile: profileDraft,
      nextShowName: showName || null,
      nextShowDate: showDate ? new Date(showDate) : null,
    });
  };

  const handleUpdateMonthlyFee = async () => {
    const feeCents = Math.round(Number(monthlyFee || 0) * 100);
    if (!feeCents || feeCents < 100) {
      toast({ variant: "destructive", title: "Invalid fee", description: "Monthly fee must be at least $1." });
      return;
    }
    await apiFetch(api.billing.updatePrice.path.replace(":id", String(athlete.id)), {
      method: api.billing.updatePrice.method,
      body: JSON.stringify({ monthlyFeeCents: feeCents }),
    });
    toast({ title: "Price updated", description: "Applies on the next billing cycle." });
  };

  const handleSavePhase = () => {
    updateAthlete.mutate({
      id: athlete.id,
      currentPhase: phaseSelection,
    });
  };

  const currentBlock = trainingBlocks?.[0];
  const currentWeeklyPlan = weeklyPlans?.[0];
  const currentNutritionPlan = nutritionPlans?.[0];
  const todaysPlan = (currentWeeklyPlan?.planJson as { days?: Array<{ day: string; focus?: string }> })?.days
    ?.find((day) => day.day?.toLowerCase() === todayLabel.toLowerCase());
  const todaysCompletion = completions?.find((item) => item.dayKey === todayLabel);
  const activeProtocols = protocols?.filter((item) => !item.endDate) || [];
  const pastProtocols = protocols?.filter((item) => item.endDate) || [];
  const latestCheckin = checkins?.[0];
  const previousCheckin = checkins?.[1];
  const latestWeightRaw = latestCheckin ? Number(getCheckinMetricValue(latestCheckin, "weight")) : null;
  const previousWeightRaw = previousCheckin ? Number(getCheckinMetricValue(previousCheckin, "weight")) : null;
  const latestWeight = Number.isFinite(latestWeightRaw) ? latestWeightRaw : null;
  const previousWeight = Number.isFinite(previousWeightRaw) ? previousWeightRaw : null;
  const weightChangePct = latestWeight && previousWeight ? ((latestWeight - previousWeight) / previousWeight) * 100 : null;
  const flags: string[] = [];
  const ratingPoses = ["front_relaxed", "back_double_biceps"];

  // Calculate specific trends based on sport
  const poseTrends = sportType === 'bodybuilding' ? ratingPoses.map((poseKey) => {
    const ratings = (checkins || [])
      .map((checkin) => checkin.poseRatings?.[poseKey])
      .filter((rating) => typeof rating === "number") as number[];
    if (ratings.length < 2) return null;
    return { poseKey, start: ratings[ratings.length - 1], end: ratings[0] };
  }).filter(Boolean) as Array<{ poseKey: string; start: number; end: number }> : [];

  const metricTrends = sportType !== 'bodybuilding' && checkins?.length && checkins.length > 1
    ? checkinConfig.metrics
      .filter((metric) => metric.type === "number" || metric.type === "rating")
      .slice(0, 3)
      .map((metric) => {
        const latestInfo = getCheckinMetricValue(checkins[0], metric.key);
        const prevInfo = getCheckinMetricValue(checkins[checkins.length - 1], metric.key);
        if (latestInfo === undefined || prevInfo === undefined) return null;
        return { label: metric.label, start: prevInfo, end: latestInfo };
      })
      .filter(Boolean)
    : [];

  if (weightChangePct && Math.abs(weightChangePct) > 1) {
    flags.push(`Weight change ${weightChangePct.toFixed(1)}%`);
  }
  if (checkins && checkins.length === 0) {
    flags.push("No check-ins yet");
  }
  if (latestCheckin && differenceInDays(new Date(), new Date(latestCheckin.date)) > 10) {
    flags.push("Check-in overdue");
  }
  if (healthMarkers && healthMarkers.length >= 2) {
    const [latestMarker, prevMarker] = healthMarkers;
    if (latestMarker.restingHr && prevMarker.restingHr && latestMarker.restingHr > prevMarker.restingHr + 5) {
      flags.push("Resting HR trending up");
    }
  }

  const handleCreateBlock = () => {
    if (!newBlockName) return;
    createTrainingBlock.mutate({
      athleteId,
      name: newBlockName,
      focus: newBlockFocus || null,
      notes: newBlockNotes || null,
      phase: athlete.currentPhase || null,
    });
    setNewBlockName("");
    setNewBlockFocus("");
    setNewBlockNotes("");
  };

  const handleCreateWeeklyPlan = () => {
    if (!currentBlock || !weeklyPlanText) return;
    const planJson = {
      days: weeklyPlanText
        .split("\n")
        .filter(Boolean)
        .map((line) => {
          const [day, focus, notes] = line.split("|").map((part) => part.trim());
          return { day, focus, notes };
        }),
    };
    createWeeklyPlan.mutate({
      trainingBlockId: currentBlock.id,
      weekStartDate: new Date(),
      planJson,
    });
    setWeeklyPlanText("");
  };

  const handleCreateNutritionPlan = () => {
    createNutritionPlan.mutate({
      athleteId,
      phase: athlete.currentPhase || null,
      weekStartDate: new Date(),
      proteinG: macroProtein ? Number(macroProtein) : null,
      carbsG: macroCarbs ? Number(macroCarbs) : null,
      fatsG: macroFats ? Number(macroFats) : null,
      calories: macroCalories ? Number(macroCalories) : null,
      notes: macroNotes || null,
    });
    setMacroProtein("");
    setMacroCarbs("");
    setMacroFats("");
    setMacroCalories("");
    setMacroNotes("");
  };

  const handleCreateProtocol = () => {
    if (!protocolName) return;
    createProtocol.mutate({
      athleteId,
      type: protocolType,
      name: protocolName,
      dose: protocolDose || null,
      frequency: protocolFrequency || null,
      startDate: new Date(),
    });
    setProtocolName("");
    setProtocolDose("");
    setProtocolFrequency("");
  };

  const handleCreateHealthMarker = () => {
    createHealthMarker.mutate({
      athleteId,
      restingHr: healthRestingHr ? Number(healthRestingHr) : null,
      bloodPressureSystolic: healthBpSys ? Number(healthBpSys) : null,
      bloodPressureDiastolic: healthBpDia ? Number(healthBpDia) : null,
      subjectiveHealth: healthScore ? Number(healthScore) : null,
      notes: healthNotes || null,
    });
    setHealthRestingHr("");
    setHealthBpSys("");
    setHealthBpDia("");
    setHealthScore("");
    setHealthNotes("");
  };

  return (
    <div className="h-full flex flex-col min-h-0 bg-background">
      <header className="z-10 bg-background/80 backdrop-blur-md border-b border-border/50 shrink-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between text-left">
          <Button variant="ghost" onClick={() => setLocation("/dashboard")}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="text-xs text-muted-foreground uppercase tracking-widest">Athlete Profile</div>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto scroll-y" style={{ WebkitOverflowScrolling: "touch" }}>
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8 pb-20">
          {/* Header & Basic Info */}
          <section className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16 border border-border">
                {athlete.avatarUrl ? <AvatarImage src={athlete.avatarUrl} alt={`${athlete.username} avatar`} /> : null}
                <AvatarFallback className="font-display font-bold text-2xl">
                  {athlete.username.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-4xl font-display font-bold tracking-tight uppercase">{athlete.displayName || athlete.username}</h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-primary px-2 py-1 bg-primary/10 rounded">{athlete.currentPhase || "Off-season"}</span>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">{SPORT_LABELS[sportType]}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setLocation(`/dashboard/messages?athleteId=${athlete.id}`)}
                variant="outline"
                className="font-bold uppercase tracking-widest h-12 px-6"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Message
              </Button>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Essential Info & Notes */}
            <div className="lg:col-span-1 space-y-8">
              <Card>
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold uppercase tracking-tight">Athlete Specifics</h2>
                    <Button variant="ghost" size="sm" onClick={handleSaveProfile} className="text-xs font-bold">Save</Button>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Next {SPORT_EVENT_LABELS[sportType]} Date</label>
                      <Input type="date" value={showDate} onChange={(e) => setShowDate(e.target.value)} />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Current Phase</label>
                      <select
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                        value={phaseSelection}
                        onChange={(event) => setPhaseSelection(event.target.value as any)}
                        onBlur={handleSavePhase}
                      >
                        <option value="off-season">Off-season</option>
                        <option value="bulking">Bulking</option>
                        <option value="cutting">Cutting</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="prep">Prep</option>
                        <option value="peak week">Peak week</option>
                        <option value="post-show">Post-show</option>
                      </select>
                    </div>

                    {profileConfig.fields.filter(f => f.key !== 'nextShowDate').map((field) => (
                      <div key={field.key} className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">{field.label}</label>
                        <Input
                          type={field.type === "number" ? "number" : "text"}
                          value={profileDraft[field.key] || ""}
                          placeholder={field.placeholder}
                          onChange={(e) => setProfileDraft(prev => ({ ...prev, [field.key]: e.target.value }))}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold uppercase tracking-tight">Coach Notes</h2>
                    <Button variant="ghost" size="sm" onClick={handleSaveProfile} className="text-xs font-bold">Save</Button>
                  </div>
                  <textarea
                    className="w-full min-h-[200px] rounded-md border border-border bg-background p-3 text-sm focus:ring-1 focus:ring-primary"
                    placeholder="Private notes about this athlete's progress, response to stimulus, etc..."
                    value={profileDraft.coachNotes || ""}
                    onChange={(e) => setProfileDraft(prev => ({ ...prev, coachNotes: e.target.value }))}
                  />
                </CardContent>
              </Card>

              <div className="pt-4">
                <Button
                  variant="ghost"
                  className="w-full text-xs font-bold uppercase tracking-widest opacity-30 hover:opacity-100"
                  onClick={() => setShowExperimental(!showExperimental)}
                >
                  {showExperimental ? "Hide Experimental Tools" : "Show Experimental Tools"}
                </Button>
              </div>
            </div>

            {/* Right Column: Check-in History */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold uppercase tracking-tight flex items-center gap-2">
                  <ClipboardList className="w-6 h-6 text-primary" />
                  Check-ins
                </h2>
              </div>

              {checkins && checkins.length > 0 && sportType === 'bodybuilding' && (
                <Card className="border-border bg-card">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Pose comparison</h3>
                      <select
                        className="border border-border bg-background px-3 py-1 rounded text-xs"
                        value={selectedPose}
                        onChange={(event) => setSelectedPose(event.target.value as any)}
                      >
                        {POSE_KEYS.map((pose) => (
                          <option key={pose.key} value={pose.key}>
                            {pose.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                      {checkins.map((checkin) => (
                        <div key={checkin.id} className="min-w-[120px] space-y-2">
                          <div className="aspect-[3/4] rounded-lg border border-border bg-secondary/20 overflow-hidden shadow-lg">
                            {checkin.posePhotos?.[selectedPose] ? (
                              <img
                                src={checkin.posePhotos[selectedPose]}
                                alt={`${selectedPose} ${checkin.date}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground text-center px-2">
                                No {selectedPose} photo
                              </div>
                            )}
                          </div>
                          <div className="text-[10px] font-bold text-center text-muted-foreground uppercase tracking-wider">
                            {format(new Date(checkin.date), "MMM d")}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-4">
                {checkins?.map((checkin) => (
                  <CheckinReviewCard key={checkin.id} checkin={checkin} sportType={sportType} />
                ))}
                {!checkins?.length && (
                  <div className="py-20 text-center border-2 border-dashed border-border rounded-3xl">
                    <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                    <p className="text-muted-foreground font-medium">No check-ins available yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {showExperimental && (
            <div className="pt-12 border-t border-border mt-12 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center">
                <span className="px-4 py-1 bg-orange-500/10 text-orange-500 text-[10px] font-bold uppercase tracking-widest rounded-full border border-orange-500/20">Experimental / Labs Area</span>
                <p className="text-xs text-muted-foreground mt-2">These features are not part of the core flow and may be removed or changed.</p>
              </div>

              <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 opacity-60 hover:opacity-100 transition-opacity">
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <h2 className="text-lg font-bold">Billing (Labs)</h2>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Status</span>
                        <span className="font-semibold">{billingForAthlete?.paymentStatus || "—"}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-muted-foreground">Monthly Fee (USD)</label>
                      <Input type="number" min="1" value={monthlyFee} onChange={(event) => setMonthlyFee(event.target.value)} />
                    </div>
                    <Button className="w-full" variant="outline" type="button" onClick={handleUpdateMonthlyFee} disabled={!billingForAthlete?.paymentStatus || billingForAthlete.paymentStatus === "incomplete"}>
                      Update Price
                    </Button>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardContent className="p-6 space-y-6">
                    <h2 className="text-lg font-bold">Files & Snapshot</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="text-sm font-semibold">Workout Plan</div>
                        <Input value={workoutPlanUrl} onChange={(e) => setWorkoutPlanUrl(e.target.value)} placeholder="Share link..." />
                        <Button className="w-full" variant="outline" onClick={handleSavePlans}>Save</Button>
                      </div>
                      <div className="space-y-4">
                        <div className="text-sm font-semibold">Meal Plan</div>
                        <Input value={mealPlanUrl} onChange={(e) => setMealPlanUrl(e.target.value)} placeholder="Share link..." />
                        <Button className="w-full" variant="outline" onClick={handleSavePlans}>Save</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Training Blocks, Protocols, Health - keeping for now but deeply buried */}
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 opacity-40 hover:opacity-100 transition-opacity">
                <Card className="lg:col-span-2">
                  <CardContent className="p-6 space-y-6">
                    <h2 className="text-lg font-bold">Training Blocks</h2>
                    {/* ... (re-add existing block logic if needed, but for simplicity let's keep it minimal) */}
                    <p className="text-xs text-muted-foreground">Training block management moved to experimental view.</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 space-y-6">
                    <h2 className="text-lg font-bold">Health & Protocols</h2>
                    <p className="text-xs text-muted-foreground">Health tracking moved to experimental view.</p>
                  </CardContent>
                </Card>
              </section>

              <section className="border border-destructive/30 rounded-xl p-6 bg-destructive/5 space-y-4">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-destructive">Danger Zone</h3>
                  <p className="text-xs text-muted-foreground">Deleting an athlete removes their account and all related history.</p>
                </div>
                <Button variant="destructive" onClick={handleDeleteAthlete} disabled={deleteAthlete.isPending}>
                  {deleteAthlete.isPending ? "Deleting..." : "Delete Athlete"}
                </Button>
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function CheckinReviewCard({ checkin, sportType }: { checkin: any; sportType: SportType }) {
  const { updateCheckin } = useCheckins();
  const [feedback, setFeedback] = useState(checkin.coachFeedback || "");
  const [isEditing, setIsEditing] = useState(false);
  const [poseRatings, setPoseRatings] = useState<Record<string, number>>(checkin.poseRatings || {});
  const [newChange, setNewChange] = useState("");
  const [coachChanges, setCoachChanges] = useState<string[]>(checkin.coachChanges || []);
  const config = SPORT_CHECKIN_CONFIGS[sportType];

  const handleSave = () => {
    updateCheckin.mutate({ id: checkin.id, coachFeedback: feedback, poseRatings, status: "reviewed" }, {
      onSuccess: () => setIsEditing(false)
    });
  };

  const handleAddChange = () => {
    if (!newChange) return;
    const next = [...coachChanges, newChange];
    setCoachChanges(next);
    setNewChange("");
    updateCheckin.mutate({ id: checkin.id, coachChanges: next });
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <span className="text-sm font-bold text-primary block">{format(new Date(checkin.date), "MMM d, yyyy")}</span>
            <span className="text-xs text-muted-foreground block mt-1">Weight: {formatMetricValue(getCheckinMetricValue(checkin, "weight"))}</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {config.metrics.slice(0, 3).map((metric) => (
              <span key={metric.key} className="px-2 py-1 rounded text-xs font-bold bg-secondary/40 text-muted-foreground">
                {metric.label}: {formatMetricValue(getCheckinMetricValue(checkin, metric.key))}
              </span>
            ))}
          </div>
        </div>

        {sportType === 'bodybuilding' && checkin.posePhotos && (
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Pose Photos</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {POSE_KEYS.map((pose) => (
                <div key={pose.key} className="rounded-md border border-border overflow-hidden bg-secondary/20">
                  {checkin.posePhotos?.[pose.key] ? (
                    <img src={checkin.posePhotos[pose.key]} alt={pose.label} className="w-full h-24 object-cover" />
                  ) : (
                    <div className="h-24 flex items-center justify-center text-[11px] text-muted-foreground">
                      {pose.label}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {sportType !== 'bodybuilding' && checkin.data && (
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground uppercase font-bold">Key Metrics</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {config.metrics.map((metric) => (
                <div key={metric.key} className="rounded-md border border-border p-3 bg-secondary/10">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{metric.label}</div>
                  <div className="text-lg font-bold">
                    {formatMetricValue(getCheckinMetricValue(checkin, metric.key))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-secondary/20 p-3 rounded">
          <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Athlete Notes</p>
          <p className="text-sm italic">{checkin.notes || "No notes provided."}</p>
        </div>
        {checkin.programChanges && (
          <div className="bg-secondary/10 p-3 rounded">
            <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Program Changes</p>
            <p className="text-sm italic">{checkin.programChanges}</p>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground uppercase font-bold">Coach Feedback</label>
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
                className="w-full min-h-[80px] p-3 rounded bg-secondary/50 text-sm focus:ring-1 focus:ring-primary"
              />
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave}>
                  Save Feedback
                </Button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => setIsEditing(true)}
              className="p-3 rounded border border-dashed border-border hover:border-primary/50 cursor-pointer min-h-[60px] text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {checkin.coachFeedback || "Click to add feedback..."}
            </div>
          )}
        </div>

        {sportType === 'bodybuilding' && (
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground uppercase font-bold">Pose Ratings</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {POSE_KEYS.map((pose) => (
                <div key={pose.key} className="flex items-center justify-between gap-2 rounded-md border border-border px-2 py-1 text-xs">
                  <span className="text-muted-foreground">{pose.label}</span>
                  <select
                    className="bg-background text-xs"
                    value={poseRatings?.[pose.key] || ""}
                    onChange={(event) => {
                      const rating = Number(event.target.value);
                      const next = { ...poseRatings, [pose.key]: rating };
                      setPoseRatings(next);
                      updateCheckin.mutate({ id: checkin.id, poseRatings: next });
                    }}
                  >
                    <option value="">-</option>
                    {[1, 2, 3, 4, 5].map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground uppercase font-bold">Change Log</label>
          <div className="space-y-2">
            {coachChanges.length ? (
              coachChanges.map((change, index) => (
                <div key={index} className="rounded-md border border-border px-3 py-2 text-xs text-muted-foreground">
                  {change}
                </div>
              ))
            ) : (
              <div className="text-xs text-muted-foreground">No updates logged.</div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Input
              value={newChange}
              onChange={(event) => setNewChange(event.target.value)}
              placeholder="Updated macros, adjusted leg day..."
            />
            <Button type="button" size="sm" onClick={handleAddChange}>
              Add
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
