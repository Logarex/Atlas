import AsyncStorage from "@react-native-async-storage/async-storage";

export type CommunityProfile = {
  id: string;
  username: string;
  displayName?: string | null;
};

const STORAGE_KEY = "@atlas/local-profile/v1";

function normalizeUsername(username: string) {
  return username
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 24);
}

function createLocalProfile(username: string): CommunityProfile {
  return {
    id: "local",
    username,
    displayName: null
  };
}

export async function getCurrentProfile(): Promise<CommunityProfile | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const profile = JSON.parse(raw) as CommunityProfile;
    return profile.username ? profile : null;
  } catch {
    return null;
  }
}

export async function ensureCommunityProfile(username?: string) {
  const existing = await getCurrentProfile();
  if (!username) return existing;

  const requestedUsername = normalizeUsername(username);
  if (requestedUsername.length < 3) {
    throw new Error("Username must contain at least 3 valid characters.");
  }

  const nextProfile = {
    ...createLocalProfile(requestedUsername),
    displayName: existing?.displayName ?? null
  };

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextProfile));
  return nextProfile;
}

export async function clearLocalProfile() {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
