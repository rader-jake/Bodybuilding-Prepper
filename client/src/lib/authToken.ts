/**
 * Auth Token Manager
 * Uses localStorage for now.
 * In a real Capacitor app, you might swap this with @capacitor/preferences
 * if you need native storage (though localStorage works fine in WKWebView).
 */

const TOKEN_KEY = "auth_token";

export function getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
}
