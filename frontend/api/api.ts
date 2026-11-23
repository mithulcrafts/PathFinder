
import { fetch } from "expo/fetch";

const PRIMARY_API_URL = process.env.EXPO_PUBLIC_API_PRIMARY!;
const FALLBACK_API_URL = process.env.EXPO_PUBLIC_API_FALLBACK;

const DEFAULT_TIMEOUT_MS = 60_000;

async function requestWithFallback(
  endpoint: string,
  options: RequestInit = {},
  token?: string,
  isMultipart: boolean = false
): Promise<Response> {
  if (!PRIMARY_API_URL) {
    throw new Error("Primary API URL is not configured.");
  }

  const urls = [
    PRIMARY_API_URL,
    ...(FALLBACK_API_URL && FALLBACK_API_URL !== PRIMARY_API_URL
      ? [FALLBACK_API_URL]
      : []),
  ];

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  if (!isMultipart && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  let lastError: unknown;

  for (let i = 0; i < urls.length; i++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      DEFAULT_TIMEOUT_MS
    );

    try {
      const baseUrl = urls[i].replace(/\/+$/, "");

      const response = await fetch(`${baseUrl}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers,
      });

      // Retry on gateway/service availability errors.
      if ([502, 503, 504].includes(response.status) && i < urls.length - 1) {
        console.warn(`Backend unavailable at ${baseUrl}. Trying fallback...`);
        continue;
      }

      return response;
    } catch (err: any) {
      lastError = err;

      if (i === urls.length - 1) {
        if (err.name === "AbortError") {
          throw new Error("Request timed out. Both backend attempts failed.");
        }
        throw err;
      }

      console.warn(`Backend request failed at ${urls[i]}. Trying fallback...`);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw lastError || new Error("All backend servers are unavailable.");
}

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {},
  token?: string,
  isMultipart: boolean = false
): Promise<Response> {
  return requestWithFallback(endpoint, options, token, isMultipart);
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string,
  isMultipart: boolean = false
): Promise<T> {
  const response = await apiRequest(endpoint, options, token, isMultipart);

  if (!response.ok) {
    let message = await response.text();

    if (message.includes("<!DOCTYPE html>") || message.includes("<html>")) {
      message =
        response.status === 404
          ? `Endpoint ${endpoint} not implemented on the backend yet.`
          : `Server error ${response.status}: ${response.statusText}`;
    } else {
      try {
        const jsonError = JSON.parse(message);
        message = jsonError.error || jsonError.message || message;
      } catch {
        // Keep the original error message.
      }
    }

    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return response.json();
}
