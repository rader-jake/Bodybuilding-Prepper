export type SportType = "bodybuilding" | "powerlifting" | "endurance" | "crossfit";

export type CheckInMetricValue = number | string | boolean;

export interface CheckInMetric {
  key: string;
  label: string;
  value: CheckInMetricValue;
}

export interface WeeklyCheckIn {
  id: number;
  athleteId: number;
  date: Date | string;
  sportType: SportType;
  metrics: CheckInMetric[];
  note: string | null;
  mediaUrls: string[];
}

export type BodybuildingProfile = {
  division?: string;
  federation?: string;
  height?: string;
  targetStageWeight?: string;
};

export type PowerliftingProfile = {
  weightClass?: string;
  currentBestTotal?: string;
};

export type EnduranceProfile = {
  raceDistance?: string;
  targetFinishTime?: string;
};

export type CrossfitProfile = {
  primaryTrainingGoal?: string;
};

export type AthleteProfileFields =
  | BodybuildingProfile
  | PowerliftingProfile
  | EnduranceProfile
  | CrossfitProfile;

export interface AthleteProfile {
  id: number;
  sportType: SportType;
  nextCompetitionDate?: Date | string | null;
  profile: AthleteProfileFields;
}
