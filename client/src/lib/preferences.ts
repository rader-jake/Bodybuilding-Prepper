/**
 * Simple preferences helper for internal app state that doesn't need to be in the database.
 * Uses localStorage which persists in Capacitor WebViews.
 */

export const PREFERENCES_KEYS = {
    HAS_SEEN_ONBOARDING: 'metalifts_has_seen_onboarding',
    HAS_SEEN_DASHBOARD_TOOLTIP: 'metalifts_has_seen_dashboard_tooltip',
    HAS_SEEN_CHECKIN_TOOLTIP: 'metalifts_has_seen_checkin_tooltip',
};

export const preferences = {
    get: (key: string, defaultValue: boolean = false): boolean => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch {
            return defaultValue;
        }
    },
    set: (key: string, value: boolean) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error('Failed to save preference', e);
        }
    },
    reset: () => {
        Object.values(PREFERENCES_KEYS).forEach(key => localStorage.removeItem(key));
    }
};
