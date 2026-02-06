
import { User } from "@shared/schema";
import { Activity, BarChart3, CalendarDays, ClipboardCheck, Dumbbell, Timer, Flame, Trophy } from "lucide-react";

export type SportType = 'bodybuilding' | 'powerlifting' | 'crossfit' | 'endurance' | 'hybrid';

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

// --- TEMPLATE DEFINITIONS ---

// Minimal core fields for EVERY athlete
const CORE_FIELDS: FieldConfig[] = [
    { id: 'weight', label: 'Bodyweight', type: 'number', required: true, isCore: true, section: 'Vitals', placeholder: 'lbs' },
];

export const CHECKIN_TEMPLATES: Record<SportType, CheckInTemplate> = {
    bodybuilding: {
        id: 'bb-minimal',
        sportType: 'bodybuilding',
        name: 'Bodybuilding Check-in',
        fields: [
            ...CORE_FIELDS,
            { id: 'posePhotos', label: 'Posing Photos', type: 'photos', required: true, isCore: true, section: 'Physique' },
            { id: 'energy', label: 'How do you feel overall this week? (1-5)', type: 'rating', required: true, isCore: true, section: 'Feedback', min: 1, max: 5 },
            { id: 'notes', label: 'Notes', type: 'textarea', required: false, isCore: true, section: 'Feedback' },
        ]
    },
    powerlifting: {
        id: 'pl-minimal',
        sportType: 'powerlifting',
        name: 'Powerlifting Check-in',
        fields: [
            ...CORE_FIELDS,
            { id: 'squat_top', label: 'Squat Top Set', type: 'text', required: true, isCore: false, section: 'Performance', placeholder: 'e.g. 315x5' },
            { id: 'bench_top', label: 'Bench Top Set', type: 'text', required: true, isCore: false, section: 'Performance', placeholder: 'e.g. 225x5' },
            { id: 'deadlift_top', label: 'Deadlift Top Set', type: 'text', required: true, isCore: false, section: 'Performance', placeholder: 'e.g. 405x5' },
            { id: 'pain_notes', label: 'Any pain/injury issues?', type: 'textarea', required: false, isCore: false, section: 'Recovery', placeholder: 'Leave blank if none' },
        ]
    },
    crossfit: {
        id: 'cf-minimal',
        sportType: 'crossfit',
        name: 'CrossFit Check-in',
        fields: [
            { id: 'sessions_count', label: 'How many sessions did you complete?', type: 'number', required: true, isCore: false, section: 'Volume' },
            { id: 'highlight_wod', label: 'Highlight one key workout or lift', type: 'textarea', required: true, isCore: false, section: 'Performance' },
            { id: 'fatigue', label: 'How beat up do you feel? (1-5)', type: 'rating', required: true, isCore: false, section: 'Recovery', min: 1, max: 5 },
            { id: 'notes', label: 'Notes', type: 'textarea', required: false, isCore: true, section: 'Feedback' },
        ]
    },
    endurance: {
        id: 'end-minimal',
        sportType: 'endurance',
        name: 'Endurance Check-in',
        fields: [
            { id: 'swim_vol', label: 'Swim Volume (Time or Dist)', type: 'text', required: true, isCore: false, section: 'Volume' },
            { id: 'bike_vol', label: 'Bike Volume (Time or Dist)', type: 'text', required: true, isCore: false, section: 'Volume' },
            { id: 'run_vol', label: 'Run Volume (Time or Dist)', type: 'text', required: true, isCore: false, section: 'Volume' },
            { id: 'fatigue', label: 'Overall fatigue this week? (1-5)', type: 'rating', required: true, isCore: false, section: 'Recovery', min: 1, max: 5 },
            { id: 'issues', label: 'Any issues (injuries, missed key sessions)?', type: 'textarea', required: false, isCore: false, section: 'Feedback' },
        ]
    },
    hybrid: {
        id: 'hyb-minimal',
        sportType: 'hybrid',
        name: 'Hybrid Check-in',
        fields: [
            ...CORE_FIELDS,
            { id: 'notes', label: 'Weekly Summary', type: 'textarea', required: true, isCore: true, section: 'Feedback' },
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
    },
    hybrid: {
        sportType: 'hybrid',
        welcomeMessage: 'Athlete Overview',
        primaryMetric: 'Readiness',
        tiles: [
            { id: 'checkins', title: 'Pending Check-ins', icon: ClipboardCheck, metricKey: 'pending_checkins' },
            { id: 'recovery', title: 'Recovery Score', icon: Activity, metricKey: 'recovery_score', color: 'text-green-500' },
            { id: 'events', title: 'Events', icon: CalendarDays, metricKey: 'upcoming_events', color: 'text-blue-500' },
        ]
    }
};

export const getTemplateForUser = (user: User | null): CheckInTemplate => {
    // For coaches: use coachIndustry, for athletes: use coach's coachIndustry (inherited)
    // If undefined, block with setup required
    let industry: SportType | undefined;
    
    if (user?.role === "coach") {
        industry = user.coachIndustry as SportType;
    } else if (user?.role === "athlete" && user?.coachId) {
        // NOTE: Athlete doesn't have direct coachIndustry; coach's should be loaded separately
        // For now, fallback to user.sport (populated from coach's coachIndustry during athlete creation)
        industry = user.sport as SportType;
    }
    
    if (!industry) {
        // Return bodybuilding as fallback, but caller should handle setup-required screen
        return CHECKIN_TEMPLATES.bodybuilding;
    }
    return CHECKIN_TEMPLATES[industry] || CHECKIN_TEMPLATES.bodybuilding;
};

export const getDashboardForUser = (user: User | null): DashboardConfig => {
    let industry: SportType | undefined;
    
    if (user?.role === "coach") {
        industry = user.coachIndustry as SportType;
    } else if (user?.role === "athlete" && user?.coachId) {
        industry = user.sport as SportType;
    }
    
    if (!industry) {
        return DASHBOARD_CONFIGS.bodybuilding;
    }
    return DASHBOARD_CONFIGS[industry] || DASHBOARD_CONFIGS.bodybuilding;
};
