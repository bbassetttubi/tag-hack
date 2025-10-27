import useSWR from "swr";
import { StoryWithSegments, CreateStoryPayload, AppendSegmentPayload, RemixSegmentPayload, TagUserPayload, CanContinueResponse } from "../types";
import { getCurrentUserToken } from "./firebase";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getCurrentUserToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  return headers;
}

async function fetcher<T>(url: string, init?: RequestInit): Promise<T> {
  const authHeaders = await getAuthHeaders();
  const response = await fetch(url, {
    ...init,
    headers: {
      ...authHeaders,
      ...init?.headers,
    },
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export function useStory(storyId?: string, options?: { refreshInterval?: number; revalidateOnFocus?: boolean }) {
  const shouldFetch = Boolean(storyId);
  return useSWR<StoryWithSegments>(shouldFetch ? `${API_BASE_URL}/stories/${storyId}` : null, fetcher, {
    refreshInterval: options?.refreshInterval ?? 5_000,
    revalidateOnFocus: options?.revalidateOnFocus ?? true,
  });
}

export async function createStory(payload: CreateStoryPayload) {
  return fetcher<{ storyId: string; segmentId: string; jobId: string }>(`${API_BASE_URL}/stories`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function appendSegment(storyId: string, payload: AppendSegmentPayload) {
  return fetcher<{ segmentId: string; totalDurationSeconds: number; jobId: string }>(`${API_BASE_URL}/stories/${storyId}/segments`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function tagUser(storyId: string, payload: TagUserPayload) {
  return fetcher<{ success: boolean; message: string }>(`${API_BASE_URL}/stories/${storyId}/tag`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function clearTag(storyId: string) {
  return fetcher<{ success: boolean; message: string }>(`${API_BASE_URL}/stories/${storyId}/tag`, {
    method: "DELETE",
  });
}

export async function checkCanContinue(storyId: string, userName: string) {
  return fetcher<CanContinueResponse>(`${API_BASE_URL}/stories/${storyId}/can-continue?userName=${encodeURIComponent(userName)}`);
}

export async function remixSegment(storyId: string, payload: RemixSegmentPayload) {
  return fetcher<{ segmentId: string; totalDurationSeconds: number; jobId: string }>(`${API_BASE_URL}/stories/${storyId}/remix`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getCombinedVideo(storyId: string) {
  return fetcher<{ videoUrl: string; lastUpdated: string }>(`${API_BASE_URL}/stories/${storyId}/combined`);
}

