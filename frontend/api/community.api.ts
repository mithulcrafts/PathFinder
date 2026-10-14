import { apiFetch } from "./api";
import { UserJourneyResponse } from "./journey.api";

export interface SearchCommunityUser {
  username: string;
  summary: string | null;
  expertiseAreas: string[] | null;
  reputationScore: number;
  matchingGoalCount: number;
  matchingGoalTitles: string[];
  journeyHighlights: string[];
  imageUrl?: string | null;
}

export interface CommunityJourney extends UserJourneyResponse {
  imageUrl?: string | null;
}

export async function getTopics(): Promise<string[]> {
  const data = await apiFetch<{ topics: string[] }>("/community/topics", { method: "GET" });
  return data.topics;
}

export interface GraphNode {
  id: string;
  title: string;
  authorUsername: string;
}

export interface GraphEdge {
  fromId: string;
  toId: string;
  label: string | null;
}

export interface CommunityGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export async function getCommunityGraph(limit = 20): Promise<CommunityGraph> {
  return apiFetch<CommunityGraph>(`/community/graph?limit=${limit}`, { method: "GET" });
}

export async function getSubtopics(topic: string): Promise<string[]> {
  const data = await apiFetch<{ subtopics: string[] }>(`/community/subtopics?topic=${encodeURIComponent(topic)}`, { method: "GET" });
  return data.subtopics;
}

export async function searchCommunity(params: {
  topic?: string;
  subtopic?: string;
  page?: number;
  limit?: number;
}): Promise<SearchCommunityUser[]> {
  const query = new URLSearchParams();
  if (params.topic) query.append("topic", params.topic);
  if (params.subtopic) query.append("subtopic", params.subtopic);
  if (params.page) query.append("page", params.page.toString());
  if (params.limit) query.append("limit", params.limit.toString());
  
  const queryString = query.toString();
  return apiFetch<SearchCommunityUser[]>(`/community${queryString ? `?${queryString}` : ""}`, { method: "GET" });
}

export async function getCommunityJourney(username: string): Promise<CommunityJourney> {
  return apiFetch<CommunityJourney>(`/community/journey/${encodeURIComponent(username)}`, { method: "GET" });
}
