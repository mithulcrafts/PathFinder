const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL!;

export interface QueryResponse {
  query: string;
  transcribed?: string;
  structuredQuery?: any;
  context?: any;
  aggregatedContext?: string;
}

import { File } from "expo-file-system";
import { Platform } from 'react-native';

export async function submitQuery(
  token: string,
  searchText?: string | null,
  audioUri?: string | null
): Promise<QueryResponse> {
  let response: Response;
  if (audioUri) {
    const formData = new FormData();
    if (Platform.OS === "web") {
      const res = await fetch(audioUri);
      const blob = await res.blob();
      formData.append("audio", blob, "recording.m4a");
    } else {
      const file = new File(audioUri);
      formData.append("audio", file);
    }
    response = await fetch(`${API_BASE_URL}/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
  } else if (searchText) {
    response = await fetch(`${API_BASE_URL}/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query: searchText }),
    });
  } else {
    throw new Error("Must provide either text query or audio.");
  }
  if (!response.ok) {
    const message = await response.text();
    throw new Error(`API error: ${message}`);
  }

  return (await response.json()) as QueryResponse;
}
