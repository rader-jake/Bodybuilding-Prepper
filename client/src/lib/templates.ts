
import { User } from "@shared/schema";
import type { SportType } from "@shared/types";
import { Activity, BarChart3, CalendarDays, ClipboardCheck, Dumbbell, Timer, Flame, Trophy } from "lucide-react";

export interface FieldConfig {
    id: string;
    label: string;
    type: 'text' | 'number' | 'textarea' | 'rating' | 'photos' | 'boolean' | 'header';
    placeholder?: string;
    required?: boolean;
    helpText?: string;
    section?: string;
    // If true, this field maps to a core column in the checkins table (e.g. weight, energy)
    // If false, it saves to the 'data' JSON column
    isCore?: boolean;
    min?: number;
    max?: number;
}

export interface CheckInTemplate {
    id: string;
    sportType: SportType;
    name: string;
    fields: FieldConfig[];
}

export interface DashboardTile {
    id: string;
    title: string;
    icon: any; // Lucide icon
    metricKey: string; // Key to fetch/calculate data
    color?: string; // Tailwind class component (e.g. text-orange-500)
}

export interface DashboardConfig {
    sportType: SportType;
    welcomeMessage: string;
    primaryMetric: string; // Label for the main chart or stat
    tiles: DashboardTile[];
}

// --- TEMPLATE DEFINITIONS ---

export const CHECKIN_TEMPLATES: Record<SportType, CheckInTemplate> = {
    bodybuilding: {
        id: 'bb-minimal',
        sportType: 'bodybuilding',
        name: 'Bodybuilding Check-in',
        fields: [
            { id: 'weight', label: 'Bodyweight', type: 'number', required: true, isCore: true, section: 'Vitals', placeholder: 'lbs' },
            { id: 'posePhotos', label: 'Posing Photos', type: 'photos', required: true, isCore: true, section: 'Physique' },
            { id: 'feel_score', label: 'Condition this week (1–5)', type: 'rating', required: true, isCore: false, section: 'Feedback', min: 1, max: 5 },
            { id: 'notes', label: 'Notes', type: 'textarea', required: false, isCore: true, section: 'Feedback' },
        ]
    },
    powerlifting: {
        id: 'pl-minimal',
        sportType: 'powerlifting',
        name: 'Powerlifting Check-in',
        fields: [
            { id: 'weight', label: 'Bodyweight', type: 'number', required: true, isCore: true, section: 'Vitals', placeholder: 'lbs' },
            { id: 'squat_top_set', label: 'Squat Top Set (kg x reps)', type: 'text', required: true, isCore: false, section: 'Performance', placeholder: 'e.g. 200 x 5' },
            { id: 'bench_top_set', label: 'Bench Top Set (kg x reps)', type: 'text', required: true, isCore: false, section: 'Performance', placeholder: 'e.g. 140 x 5' },
            { id: 'deadlift_top_set', label: 'Deadlift Top Set (kg x reps)', type: 'text', required: true, isCore: false, section: 'Performance', placeholder: 'e.g. 230 x 3' },
            { id: 'pain_flag', label: 'Any pain/injury issues?', type: 'boolean', required: false, isCore: false, section: 'Recovery' },
            { id: 'pain_note', label: 'Pain/Injury notes', type: 'textarea', required: false, isCore: false, section: 'Recovery' },
        ]
    },
    crossfit: {
        id: 'cf-minimal',
        sportType: 'crossfit',
        name: 'CrossFit Check-in',
        fields: [
            { id: 'sessions_completed', label: 'Sessions completed', type: 'number', required: true, isCore: false, section: 'Volume' },
            { id: 'highlight_performance', label: 'Highlighted performance', type: 'textarea', required: true, isCore: false, section: 'Performance' },
            { id: 'beat_up', label: 'How beat up do you feel? (1-5)', type: 'rating', required: true, isCore: false, section: 'Recovery', min: 1, max: 5 },
            { id: 'notes', label: 'Notes', type: 'textarea', required: false, isCore: true, section: 'Feedback' },
        ]
    },
    endurance: {
        id: 'end-minimal',
        sportType: 'endurance',
        name: 'Endurance Check-in',
        fields: [
            { id: 'swim_volume', label: 'Swim volume (minutes)', type: 'number', required: true, isCore: false, section: 'Volume' },
            { id: 'bike_volume', label: 'Bike volume (minutes)', type: 'number', required: true, isCore: false, section: 'Volume' },
            { id: 'run_volume', label: 'Run volume (minutes)', type: 'number', required: true, isCore: false, section: 'Volume' },
            { id: 'fatigue', label: 'Overall fatigue this week? (1-5)', type: 'rating', required: true, isCore: false, section: 'Recovery', min: 1, max: 5 },
            { id: 'notes', label: 'Issues / missed sessions', type: 'textarea', required: false, isCore: false, section: 'Feedback' },
        ]
    }
};

// --- DASHBOARD CONFIGS ---

export const DASHBOARD_CONFIGS: Record<SportType, DashboardConfig> = {
    bodybuilding: {
        sportType: 'bodybuilding',
        welcomeMessage: 'Prep Status',
        primaryMetric: 'Weeks Out',
        tiles: [
            { id: 'checkins', title: 'Pending Check-ins', icon: ClipboardCheck, metricKey: 'pending_checkins', color: 'text-orange-500' },
            { id: 'compliance', title: 'Plan Compliance', icon: Activity, metricKey: 'compliance_pct', color: 'text-emerald-500' },
            { id: 'shows', title: 'Upcoming Shows', icon: Trophy, metricKey: 'upcoming_events', color: 'text-primary' },
        ]
    },
    powerlifting: {
        sportType: 'powerlifting',
        welcomeMessage: 'Strength Block',
        primaryMetric: 'Next Meet',
        tiles: [
            { id: 'checkins', title: 'Pending Check-ins', icon: ClipboardCheck, metricKey: 'pending_checkins' },
            { id: 'totals', title: 'Total Increases', icon: BarChart3, metricKey: 'pr_count', color: 'text-emerald-500' },
            { id: 'meets', title: 'Upcoming Meets', icon: CalendarDays, metricKey: 'upcoming_events', color: 'text-blue-500' },
        ]
    },
    crossfit: {
        sportType: 'crossfit',
        welcomeMessage: 'Performance Tracking',
        primaryMetric: 'Open Rank',
        tiles: [
            { id: 'checkins', title: 'Pending Check-ins', icon: ClipboardCheck, metricKey: 'pending_checkins' },
            { id: 'benchmarks', title: 'Benchmark PRs', icon: Timer, metricKey: 'pr_count', color: 'text-purple-500' },
            { id: 'health', title: 'Injury Watch', icon: Activity, metricKey: 'injury_flags', color: 'text-red-500' },
        ]
    },
    endurance: {
        sportType: 'endurance',
        welcomeMessage: 'Volume Cycle',
        primaryMetric: 'Weekly Dist',
        tiles: [
            { id: 'volume', title: 'Total Volume', icon: BarChart3, metricKey: 'total_volume', color: 'text-blue-500' },
            { id: 'checkins', title: 'Check-ins Due', icon: ClipboardCheck, metricKey: 'pending_checkins' },
            { id: 'races', title: 'Upcoming Races', icon: Flame, metricKey: 'upcoming_events', color: 'text-orange-500' },
        ]
    }
};

export const getTemplateForUser = (user: User | null): CheckInTemplate => {
    // For coaches: use coachIndustry, for athletes: use coach's coachIndustry (inherited)
    // If undefined, block with setup required
    let industry: SportType | undefined;

    const u = user as any;
    if (user?.role === "coach") {
        industry = user.coachIndustry as SportType;
    } else if (user?.role === "athlete") {
        industry = (u?.effectiveIndustry || u?.sport) as SportType;
    }


    if (!industry) {
        // Caller must handle this case
        throw new Error("No industry found for user");
    }
    return CHECKIN_TEMPLATES[industry];
};

export const getDashboardForUser = (user: User | null): DashboardConfig => {
    let industry: SportType | undefined;

    const u = user as any;
    if (user?.role === "coach") {
        industry = user.coachIndustry as SportType;
    } else if (user?.role === "athlete") {
        industry = (u?.effectiveIndustry || u?.sport) as SportType;
    }


    if (!industry) {
        throw new Error("No industry found for user");
    }
    return DASHBOARD_CONFIGS[industry];
};
