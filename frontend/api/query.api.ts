
import { apiRequest } from "./api";
import { File } from "expo-file-system";
import { Platform } from "react-native";

export interface QueryResponse {
  query: string;
  transcribed?: string;
  structuredQuery?: any;
  context?: any;
  aggregatedContext?: string;
}

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

    response = await apiRequest(
      "/query",
      {
        method: "POST",
        body: formData,
      },
      token,
      true
    );
  } else if (searchText) {
    response = await apiRequest(
      "/query",
      {
        method: "POST",
        body: JSON.stringify({ query: searchText }),
      },
      token
    );
  } else {
    throw new Error("Must provide either text query or audio.");
  }

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`API error: ${message}`);
  }

  return (await response.json()) as QueryResponse;
}
