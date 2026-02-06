import { useAuth } from "@/hooks/use-auth";
import { useAthletes } from "@/hooks/use-athletes";
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
import { getTemplateForUser } from "@/lib/templates";

export default function CoachAthleteProfile() {
  const { user } = useAuth();
  const { athletes, isLoading, updateAthlete } = useAthletes();
  const [, params] = useRoute("/dashboard/athletes/:id");
  const [, setLocation] = useLocation();

  const athleteId = Number(params?.id);
  const athlete = athletes?.find((item) => item.id === athleteId);

  // Determine template based on athlete's sport (defaults to bodybuilding)
  const template = getTemplateForUser(athlete || null);
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
    }
  }, [athlete]);

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

  const handleSaveShow = () => {
    updateAthlete.mutate({
      id: athlete.id,
      nextShowName: showName || null,
      nextShowDate: showDate ? new Date(showDate) : null,
    });
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
  const latestWeight = latestCheckin?.weight ? parseFloat(latestCheckin.weight) : null;
  const previousWeight = previousCheckin?.weight ? parseFloat(previousCheckin.weight) : null;
  const weightChangePct = latestWeight && previousWeight ? ((latestWeight - previousWeight) / previousWeight) * 100 : null;
  const flags: string[] = [];
  const ratingPoses = ["front_relaxed", "back_double_biceps"];

  // Calculate specific trends based on sport
  const poseTrends = template.sportType === 'bodybuilding' ? ratingPoses.map((poseKey) => {
    const ratings = (checkins || [])
      .map((checkin) => checkin.poseRatings?.[poseKey])
      .filter((rating) => typeof rating === "number") as number[];
    if (ratings.length < 2) return null;
    return { poseKey, start: ratings[ratings.length - 1], end: ratings[0] };
  }).filter(Boolean) as Array<{ poseKey: string; start: number; end: number }> : [];

  // For powerlifting/other, we could calculate Max trends here
  const metricTrends = template.sportType !== 'bodybuilding' && checkins?.length && checkins.length > 1 ?
    template.fields.filter(f => f.type === 'number').slice(0, 3).map(field => {
      const latestInfo = checkins[0].data?.[field.id] || checkins[0].weight; // fallback for core fields
      const prevInfo = checkins[checkins.length - 1].data?.[field.id] || checkins[checkins.length - 1].weight;
      if (!latestInfo || !prevInfo) return null;
      return { label: field.label, start: prevInfo, end: latestInfo };
    }).filter(Boolean) : [];

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
          <section className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="w-14 h-14 border border-border">
                {athlete.avatarUrl ? <AvatarImage src={athlete.avatarUrl} alt={`${athlete.username} avatar`} /> : null}
                <AvatarFallback className="font-display font-bold text-xl">
                  {athlete.username.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-3xl font-display font-bold tracking-tight uppercase">{athlete.displayName || athlete.username}</h1>
                <p className="text-sm text-muted-foreground font-medium mt-1">
                  {athlete.bio || "Pro Athlete • Ready for stage"}
                </p>
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
              <div className="hidden sm:flex flex-col items-end gap-1 px-4 py-2 bg-secondary/20 rounded-xl border border-border/50">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Current Phase</span>
                <span className="text-sm font-bold uppercase text-primary">{athlete.currentPhase || "Off-season"}</span>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardContent className="p-6 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold flex items-center gap-2">
                      <ClipboardList className="w-5 h-5 text-emerald-500" />
                      Plans & Documents
                    </h2>
                    <p className="text-sm text-muted-foreground">Upload PDFs or paste a share link for quick access.</p>
                  </div>
                  <Button type="button" onClick={handleSavePlans}>
                    Save links
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="rounded-xl border border-border bg-background p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold">Workout Plan</div>
                      {workoutPlanUrl ? (
                        <a
                          className="text-xs text-primary hover:underline"
                          href={workoutPlanUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">No link yet</span>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                        <LinkIcon className="w-4 h-4" />
                        Paste share link
                      </label>
                      <Input
                        value={workoutPlanUrl}
                        onChange={(event) => setWorkoutPlanUrl(event.target.value)}
                        placeholder="https://docs.google.com/..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-muted-foreground">
                        Upload file
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,application/pdf"
                        className="block w-full text-xs text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-secondary/60 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-foreground"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) handleUploadWorkout(file);
                        }}
                      />
                      {isUploadingWorkout && <p className="text-xs text-muted-foreground">Uploading workout plan...</p>}
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-background p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold">Meal Plan</div>
                      {mealPlanUrl ? (
                        <a
                          className="text-xs text-primary hover:underline"
                          href={mealPlanUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">No link yet</span>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                        <LinkIcon className="w-4 h-4" />
                        Paste share link
                      </label>
                      <Input
                        value={mealPlanUrl}
                        onChange={(event) => setMealPlanUrl(event.target.value)}
                        placeholder="https://docs.google.com/..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-muted-foreground">
                        Upload file
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,application/pdf"
                        className="block w-full text-xs text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-secondary/60 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-foreground"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) handleUploadMeal(file);
                        }}
                      />
                      {isUploadingMeal && <p className="text-xs text-muted-foreground">Uploading meal plan...</p>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Target className="w-5 h-5 text-emerald-500" />
                  Readiness Snapshot
                </h2>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>Last check-in</span>
                    <span className="text-foreground">{latestCheckin ? format(new Date(latestCheckin.date), "MMM d") : "—"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Weight change</span>
                    <span className="text-foreground">{weightChangePct ? `${weightChangePct.toFixed(1)}%` : "—"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Active protocols</span>
                    <span className="text-foreground">{activeProtocols.length}</span>
                  </div>
                </div>
                <div className="pt-2">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                    <ShieldAlert className="w-4 h-4" />
                    Flags
                  </div>
                  {flags.length ? (
                    <div className="mt-2 space-y-1">
                      {flags.map((flag) => (
                        <div key={flag} className="rounded-md border border-border px-3 py-2 text-xs text-muted-foreground">
                          {flag}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-2 text-xs text-muted-foreground">No flags detected.</div>
                  )}
                </div>
                <div className="pt-2">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    {template.sportType === 'bodybuilding' ? 'Pose Ratings' : 'Key Metrics'}
                  </div>
                  {template.sportType === 'bodybuilding' ? (
                    poseTrends.length ? (
                      <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                        {poseTrends.map((trend) => (
                          <div key={trend.poseKey} className="flex items-center justify-between">
                            <span>{POSE_KEYS.find((pose) => pose.key === trend.poseKey)?.label || trend.poseKey}</span>
                            <span>{trend.start} → {trend.end}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-2 text-xs text-muted-foreground">No pose ratings yet.</div>
                    )
                  ) : (
                    (metricTrends as any[])?.length ? (
                      <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                        {(metricTrends as any[]).map((trend: any, i: number) => (
                          <div key={i} className="flex items-center justify-between">
                            <span>{trend?.label}</span>
                            <span>{trend?.start} → {trend?.end}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-2 text-xs text-muted-foreground">No sufficient data yet.</div>
                    )
                  )}
                </div>
                <div className="rounded-lg bg-secondary/40 p-3 text-xs text-muted-foreground">
                  Keep plans and health markers updated to improve readiness signals.
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold flex items-center gap-2">
                      <CalendarDays className="w-5 h-5 text-emerald-500" />
                      {template.sportType === 'bodybuilding' ? 'Show Countdown' : 'Event Countdown'}
                    </h2>
                    <p className="text-sm text-muted-foreground">Set the next {template.sportType === 'bodybuilding' ? 'show' : 'event'} date for this athlete.</p>
                  </div>
                  <Button type="button" onClick={handleSaveShow}>
                    Save {template.sportType === 'bodybuilding' ? 'show' : 'event'}
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input value={showName} onChange={(event) => setShowName(event.target.value)} placeholder="Show name" />
                  <Input value={showDate} onChange={(event) => setShowDate(event.target.value)} type="date" />
                </div>
                {athlete.nextShowDate && (
                  <div className="text-xs text-muted-foreground">
                    Current show: {athlete.nextShowName || "Show"} • {format(new Date(athlete.nextShowDate), "MMM d, yyyy")}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Phase</div>
                <select
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  value={phaseSelection}
                  onChange={(event) => setPhaseSelection(event.target.value as any)}
                >
                  <option value="off-season">Off-season</option>
                  <option value="bulking">Bulking</option>
                  <option value="cutting">Cutting</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="prep">Prep</option>
                  <option value="peak week">Peak week</option>
                  <option value="post-show">Post-show</option>
                </select>
                <Button type="button" onClick={handleSavePhase}>
                  Save phase
                </Button>
                <p className="text-xs text-muted-foreground">Visible on athlete dashboards and plans.</p>
              </CardContent>
            </Card>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardContent className="p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-emerald-500" />
                    Training & Nutrition
                  </h2>
                  <p className="text-sm text-muted-foreground">Maintain current blocks and weekly targets.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold">Current Training Block</h3>
                    {currentBlock ? (
                      <div className="rounded-lg border border-border p-4 space-y-1 text-sm">
                        <div className="font-semibold">{currentBlock.name}</div>
                        <div className="text-muted-foreground">{currentBlock.focus || "General focus"}</div>
                        {currentBlock.notes && <div className="text-xs text-muted-foreground">{currentBlock.notes}</div>}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">No block yet.</div>
                    )}
                    <div className="space-y-2">
                      <Input
                        value={newBlockName}
                        onChange={(event) => setNewBlockName(event.target.value)}
                        placeholder="Block name"
                      />
                      <Input
                        value={newBlockFocus}
                        onChange={(event) => setNewBlockFocus(event.target.value)}
                        placeholder="Focus (e.g., back & hamstrings)"
                      />
                      <Input
                        value={newBlockNotes}
                        onChange={(event) => setNewBlockNotes(event.target.value)}
                        placeholder="Notes"
                      />
                      <Button type="button" onClick={handleCreateBlock}>
                        Add training block
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      Weekly Split
                    </h3>
                    {currentWeeklyPlan?.planJson ? (
                      <div className="rounded-lg border border-border p-4 space-y-2 text-sm">
                        {(currentWeeklyPlan.planJson as any)?.days?.map((day: any, index: number) => (
                          <div key={index} className="flex items-center justify-between text-xs">
                            <span className="font-semibold">{day.day}</span>
                            <span className="text-muted-foreground">{day.focus}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">No weekly split yet.</div>
                    )}
                    {todaysPlan && (
                      <div className="rounded-md border border-border bg-secondary/20 px-3 py-2 text-xs text-muted-foreground">
                        Today: {todaysPlan.day} • {todaysPlan.focus || "Training"} — {todaysCompletion?.completed ? "Completed" : "Pending"}
                      </div>
                    )}
                    <div className="space-y-2">
                      <textarea
                        value={weeklyPlanText}
                        onChange={(event) => setWeeklyPlanText(event.target.value)}
                        className="w-full min-h-[120px] rounded-md border border-border bg-background p-3 text-xs"
                        placeholder="Mon | Push | Bench + accessories"
                      />
                      <Button type="button" onClick={handleCreateWeeklyPlan} disabled={!currentBlock}>
                        Save weekly split
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-background p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Nutrition Targets</h3>
                    <Button type="button" variant="ghost" size="sm" onClick={handleCreateNutritionPlan}>
                      Save macros
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Input value={macroProtein} onChange={(event) => setMacroProtein(event.target.value)} placeholder="Protein (g)" />
                    <Input value={macroCarbs} onChange={(event) => setMacroCarbs(event.target.value)} placeholder="Carbs (g)" />
                    <Input value={macroFats} onChange={(event) => setMacroFats(event.target.value)} placeholder="Fats (g)" />
                    <Input value={macroCalories} onChange={(event) => setMacroCalories(event.target.value)} placeholder="Calories" />
                  </div>
                  <Input value={macroNotes} onChange={(event) => setMacroNotes(event.target.value)} placeholder="Notes" />
                  {currentNutritionPlan && (
                    <div className="text-xs text-muted-foreground">
                      Current: {currentNutritionPlan.proteinG}P / {currentNutritionPlan.carbsG}C / {currentNutritionPlan.fatsG}F • {currentNutritionPlan.calories} kcal
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <HeartPulse className="w-5 h-5 text-emerald-500" />
                    Protocols & Health
                  </h2>
                  <p className="text-xs text-muted-foreground">Track protocols and health markers responsibly.</p>
                </div>

                <div className="space-y-3">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Add protocol</div>
                  <select
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    value={protocolType}
                    onChange={(event) => setProtocolType(event.target.value as "supplement" | "compound")}
                  >
                    <option value="supplement">Supplement</option>
                    <option value="compound">Compound</option>
                  </select>
                  <Input value={protocolName} onChange={(event) => setProtocolName(event.target.value)} placeholder="Name" />
                  <Input value={protocolDose} onChange={(event) => setProtocolDose(event.target.value)} placeholder="Dose" />
                  <Input value={protocolFrequency} onChange={(event) => setProtocolFrequency(event.target.value)} placeholder="Frequency" />
                  <Button type="button" onClick={handleCreateProtocol}>
                    Add protocol
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Active protocols</div>
                  {activeProtocols.length ? (
                    activeProtocols.map((item) => (
                      <div key={item.id} className="rounded-md border border-border p-2 text-xs">
                        <div className="font-semibold">{item.name}</div>
                        <div className="text-muted-foreground">{item.dose} • {item.frequency}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-muted-foreground">None active.</div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Health markers</div>
                  <Input value={healthRestingHr} onChange={(event) => setHealthRestingHr(event.target.value)} placeholder="Resting HR" />
                  <div className="grid grid-cols-2 gap-2">
                    <Input value={healthBpSys} onChange={(event) => setHealthBpSys(event.target.value)} placeholder="BP systolic" />
                    <Input value={healthBpDia} onChange={(event) => setHealthBpDia(event.target.value)} placeholder="BP diastolic" />
                  </div>
                  <Input value={healthScore} onChange={(event) => setHealthScore(event.target.value)} placeholder="Subjective health (1-10)" />
                  <Input value={healthNotes} onChange={(event) => setHealthNotes(event.target.value)} placeholder="Notes" />
                  <Button type="button" variant="outline" onClick={handleCreateHealthMarker}>
                    Log marker
                  </Button>
                  {healthMarkers?.length ? (
                    <div className="rounded-md border border-border p-2 text-xs text-muted-foreground">
                      Last: {healthMarkers[0].restingHr || "—"} bpm • {healthMarkers[0].bloodPressureSystolic || "—"}/
                      {healthMarkers[0].bloodPressureDiastolic || "—"} BP • {healthMarkers[0].subjectiveHealth || "—"}/10
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-emerald-500" />
                Check-in History
              </h2>
              <span className="text-xs text-muted-foreground">
                {checkins?.length ? `Last check-in ${format(new Date(checkins[0].date), "MMM d, yyyy")}` : "No check-ins yet"}
              </span>
            </div>
            {checkins && checkins.length > 0 && template.sportType === 'bodybuilding' && (
              <Card className="border-border bg-card">
                <CardContent className="p-6 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold">Pose comparison</h3>
                      <p className="text-xs text-muted-foreground">Review a single pose across check-ins.</p>
                    </div>
                    <select
                      className="border border-border bg-background px-3 py-2 rounded-md text-sm"
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
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {checkins.map((checkin) => (
                      <div key={checkin.id} className="min-w-[140px] space-y-2">
                        <div className="aspect-square rounded-lg border border-border bg-secondary/20 overflow-hidden">
                          {checkin.posePhotos?.[selectedPose] ? (
                            <img
                              src={checkin.posePhotos[selectedPose]}
                              alt={`${selectedPose} ${checkin.date}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                              No photo
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(checkin.date), "MMM d")}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            <div className="grid grid-cols-1 gap-4">
              {checkins?.map((checkin) => (
                <CheckinReviewCard key={checkin.id} checkin={checkin} template={template} />
              ))}
              {!checkins?.length && (
                <Card>
                  <CardContent className="py-10 text-center text-muted-foreground">
                    No check-ins available yet.
                  </CardContent>
                </Card>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function CheckinReviewCard({ checkin, template }: { checkin: any, template: any }) {
  const { updateCheckin } = useCheckins();
  const [feedback, setFeedback] = useState(checkin.coachFeedback || "");
  const [isEditing, setIsEditing] = useState(false);
  const [poseRatings, setPoseRatings] = useState<Record<string, number>>(checkin.poseRatings || {});
  const [newChange, setNewChange] = useState("");
  const [coachChanges, setCoachChanges] = useState<string[]>(checkin.coachChanges || []);

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
            <span className="text-xs text-muted-foreground block mt-1">Weight: {checkin.weight} lbs</span>
          </div>
          <div className="flex gap-2">
            <span className={`px-2 py-1 rounded text-xs font-bold ${checkin.adherence > 8 ? "bg-emerald-500/20 text-emerald-500" : "bg-red-500/20 text-red-500"}`}>
              Adherence: {checkin.adherence}/10
            </span>
            <span className="px-2 py-1 rounded text-xs font-bold bg-secondary/40 text-muted-foreground">
              Stress: {checkin.stress}/10
            </span>
            <span className="px-2 py-1 rounded text-xs font-bold bg-secondary/40 text-muted-foreground">
              Sleep: {checkin.sleep} hrs
            </span>
          </div>
        </div>

        {template.sportType === 'bodybuilding' && checkin.posePhotos && (
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

        {template.sportType !== 'bodybuilding' && checkin.data && (
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground uppercase font-bold">Key Metrics</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {template.fields.filter((f: any) => !f.isCore).map((field: any) => (
                <div key={field.id} className="rounded-md border border-border p-3 bg-secondary/10">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{field.label}</div>
                  <div className="text-lg font-bold">
                    {checkin.data[field.id] ? checkin.data[field.id] : '—'}
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

        {template.sportType === 'bodybuilding' && (
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
