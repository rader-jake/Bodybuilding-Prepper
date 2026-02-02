import { getToken } from "./authToken";

// Detect API URL from environment variables, fallback to empty string (relative path)
// In Vite, use import.meta.env.VITE_API_URL
export const baseURL = import.meta.env.VITE_API_URL || "";

type FetchOptions = RequestInit & {
    // Add any custom options here if needed later
};

export class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}

/**
 * Wrapper around fetch that adds:
 * 1. Base URL
 * 2. Authorization header (Bearer token)
 * 3. Default Content-Type: application/json
 * 4. Error handling
 */
export async function apiFetch<T = any>(path: string, options: FetchOptions = {}): Promise<T> {
    const token = getToken();

    const headers = new Headers(options.headers);

    // Set default content type if not provided (and not sending FormData)
    if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
        headers.set("Content-Type", "application/json");
    }

    // Add Authorization header if token exists
    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    // Ensure path starts with / if not present (unless it's an absolute URL, but assuming relative to baseURL)
    // If path is already absolute (http...), use it directly, otherwise prepend baseURL
    const url = path.startsWith("http") ? path : `${baseURL}${path}`;

    const response = await fetch(url, {
        ...options,
        headers,
    });

    // Handle 401 Unauthorized globally if needed (e.g. redirect to login)
    // For now, let the caller handle it or throw
    if (response.status === 401) {
        // Optionally clear token here if you want auto-logout
        // clearToken(); 
    }

    if (!response.ok) {
        let errorMessage = "An error occurred";
        try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
        } catch (e) {
            // If response is not JSON, use status text
            errorMessage = response.statusText;
        }
        throw new ApiError(errorMessage, response.status);
    }

    // If response has no content (e.g. 204), return null/undefined
    if (response.status === 204) {
        return null as T;
    }

    return response.json();
}
