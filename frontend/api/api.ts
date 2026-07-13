const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL!;
const DEFAULT_TIMEOUT_MS = 60_000; // 60 seconds to allow for long LLM processing
import { fetch } from "expo/fetch";

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string,
  isMultipart: boolean = false
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    
    if (!isMultipart && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(
      `${API_BASE_URL}${endpoint}`,
      {
        ...options,
        signal: controller.signal,
        headers,
      }
    );

    if (!response.ok) {
      let message = await response.text();
      // If the backend returns HTML (e.g. 404 Cannot GET), clean it up
      if (message.includes("<!DOCTYPE html>") || message.includes("<html>")) {
        if (response.status === 404) {
          message = `Endpoint ${endpoint} not implemented on the backend yet.`;
        } else {
          message = `Server error ${response.status}: ${response.statusText}`;
        }
      } else {
        try {
          const jsonError = JSON.parse(message);
          message = jsonError.error || jsonError.message || message;
        } catch {
          // keep as raw text
        }
      }
      throw new Error(message || `Request failed with status ${response.status}`);
    }

    return response.json();
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new Error(`Request timed out after ${DEFAULT_TIMEOUT_MS / 1000} seconds. Please check if your backend server is running and accessible.`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
