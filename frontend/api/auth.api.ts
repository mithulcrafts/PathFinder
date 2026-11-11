import { apiFetch } from "./api";
import { createRequestCache } from "../utils/requestCache";

export interface SyncedUser {
  clerkId: string;
  email: string;
  username: string | null;
  preferredLanguage: string | null;
  reputationScore: number;
  flagCount: number;
  isFlagged: boolean;
}

const syncedUsers = createRequestCache<SyncedUser>(15_000);
export const clearSyncedUser = () => syncedUsers.clear();

export async function syncUser(
  token: string
): Promise<SyncedUser> {

  return syncedUsers.get(token, () => apiFetch<SyncedUser>(
    "/auth/sync", { method: "POST" }, token));
}

export async function updateProfile(
  token: string,
  body: {
    username?: string;
    preferredLanguage?: string;
  }
): Promise<SyncedUser> {

  clearSyncedUser();
  try {
    return await apiFetch<SyncedUser>(
      "/user/profile",
      {
        method: "PATCH",
        body: JSON.stringify(body),
      },
      token
    );
  } finally {
    clearSyncedUser();
  }
}
