import type { User } from "@shared/schema";
import type { SportType } from "@shared/types";

export type MetricType = "number" | "text" | "rating" | "boolean";

export interface CheckinMetricConfig {
  key: string;
  label: string;
  type: MetricType;
  required?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
}

export interface SportCheckinConfig {
  metrics: CheckinMetricConfig[];
  requiresPhotos: boolean;
  summaryMetrics: string[];
}

export interface SportProfileField {
  key: string;
  label: string;
  type: "text" | "number" | "date";
  required?: boolean;
  placeholder?: string;
  source?: "profile" | "user";
}

export interface SportProfileConfig {
  competitionLabel: string;
  fields: SportProfileField[];
}

export const SPORT_LABELS: Record<SportType, string> = {
  bodybuilding: "Bodybuilding",
  powerlifting: "Powerlifting",
  endurance: "Endurance",
  crossfit: "CrossFit",
};

export const SPORT_EVENT_LABELS: Record<SportType, string> = {
  bodybuilding: "Show",
  powerlifting: "Meet",
  endurance: "Race",
  crossfit: "Competition",
};

export const SPORT_PROFILE_CONFIGS: Record<SportType, SportProfileConfig> = {
  bodybuilding: {
    competitionLabel: "Show Date",
    fields: [
      { key: "division", label: "Division", type: "text", required: true },
      { key: "federation", label: "Federation", type: "text", required: true },
      { key: "height", label: "Height", type: "text" },
      { key: "targetStageWeight", label: "Target Stage Weight", type: "text" },
      { key: "nextShowDate", label: "Show Date", type: "date", source: "user" },
    ],
  },
  powerlifting: {
    competitionLabel: "Meet Date",
    fields: [
      { key: "weightClass", label: "Weight Class", type: "text", required: true },
      { key: "currentBestTotal", label: "Current Best Total", type: "text" },
      { key: "nextShowDate", label: "Meet Date", type: "date", source: "user" },
    ],
  },
  endurance: {
    competitionLabel: "Race Date",
    fields: [
      { key: "raceDistance", label: "Race Distance", type: "text", required: true, placeholder: "70.3, full, Olympic..." },
      { key: "targetFinishTime", label: "Target Finish Time", type: "text" },
      { key: "nextShowDate", label: "Race Date", type: "date", source: "user" },
    ],
  },
  crossfit: {
    competitionLabel: "Competition Date",
    fields: [
      { key: "primaryTrainingGoal", label: "Primary Training Goal", type: "text", required: true },
      { key: "nextShowDate", label: "Competition Date", type: "date", source: "user" },
    ],
  },
};

export const SPORT_CHECKIN_CONFIGS: Record<SportType, SportCheckinConfig> = {
  bodybuilding: {
    metrics: [
      { key: "weight", label: "Bodyweight", type: "number", required: true },
      { key: "feel_score", label: "Condition This Week (1–5)", type: "rating", required: true, min: 1, max: 5 },
    ],
    requiresPhotos: true,
    summaryMetrics: ["weight", "feel_score"],
  },
  powerlifting: {
    metrics: [
      { key: "weight", label: "Bodyweight", type: "number", required: true },
      { key: "squat_top_set", label: "Squat Top Set (kg x reps)", type: "text", required: true, placeholder: "e.g. 200 x 5" },
      { key: "bench_top_set", label: "Bench Top Set (kg x reps)", type: "text", required: true, placeholder: "e.g. 140 x 5" },
      { key: "deadlift_top_set", label: "Deadlift Top Set (kg x reps)", type: "text", required: true, placeholder: "e.g. 230 x 3" },
      { key: "pain_flag", label: "Any Pain/Injury Issues?", type: "boolean" },
      { key: "pain_note", label: "Pain/Injury Notes", type: "text", placeholder: "Short note if needed" },
    ],
    requiresPhotos: false,
    summaryMetrics: ["weight", "squat_top_set", "deadlift_top_set"],
  },
  endurance: {
    metrics: [
      { key: "swim_volume", label: "Swim Volume (minutes)", type: "number", required: true },
      { key: "bike_volume", label: "Bike Volume (minutes)", type: "number", required: true },
      { key: "run_volume", label: "Run Volume (minutes)", type: "number", required: true },
      { key: "fatigue", label: "Overall Fatigue (1–5)", type: "rating", required: true, min: 1, max: 5 },
    ],
    requiresPhotos: false,
    summaryMetrics: ["swim_volume", "bike_volume", "run_volume"],
  },
  crossfit: {
    metrics: [
      { key: "sessions_completed", label: "Sessions Completed", type: "number", required: true },
      { key: "highlight_performance", label: "Highlighted Performance", type: "text", required: true, placeholder: "WOD result or key lift" },
      { key: "beat_up", label: "How Beat Up Do You Feel? (1–5)", type: "rating", required: true, min: 1, max: 5 },
    ],
    requiresPhotos: false,
    summaryMetrics: ["sessions_completed", "highlight_performance", "beat_up"],
  },
};

export const getSportTypeForUser = (user: User | null | undefined): SportType => {
  if (!user) return "bodybuilding"; // Safe default during loading/redirects

  // Resolve industry: coachIndustry for coaches, effectiveIndustry for athletes
  const sport = (user.role === "coach" ? user.coachIndustry : user.effectiveIndustry) as SportType;

  if (!sport) {
    // Default to bodybuilding for athletes or if industry is not yet set
    return "bodybuilding";
  }
  return sport;
};

