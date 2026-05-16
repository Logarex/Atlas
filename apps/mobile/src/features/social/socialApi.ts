import { isSupabaseConfigured, supabase } from "@/lib/supabase";

import type { LocalVisit } from "../visits/visit.types";

export type CommunityProfile = {
  id: string;
  username: string;
  displayName?: string | null;
  publicProfile: boolean;
};

function assertSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase is not configured yet.");
  }

  return supabase;
}

function normalizeUsername(username: string) {
  return username
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 24);
}

function usernameFromUserId(userId: string) {
  return `atlas_${userId.replace(/-/g, "").slice(0, 10)}`;
}

export async function getCurrentProfile(): Promise<CommunityProfile | null> {
  const client = assertSupabase();
  const {
    data: { session }
  } = await client.auth.getSession();

  if (!session?.user) return null;

  const { data, error } = await client
    .from("profiles")
    .select("id, username, display_name, public_profile")
    .eq("id", session.user.id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    username: data.username,
    displayName: data.display_name,
    publicProfile: data.public_profile
  };
}

export async function ensureCommunityProfile(username?: string) {
  const client = assertSupabase();
  let {
    data: { session }
  } = await client.auth.getSession();

  if (!session?.user) {
    const { data, error } = await client.auth.signInAnonymously();
    if (error) throw error;
    session = data.session;
  }

  if (!session?.user) {
    throw new Error("Could not create a community session.");
  }

  const userId = session.user.id;
  const requestedUsername = username ? normalizeUsername(username) : usernameFromUserId(userId);
  const safeUsername = requestedUsername.length >= 3 ? requestedUsername : usernameFromUserId(userId);

  const { data: existing, error: readError } = await client
    .from("profiles")
    .select("id, username, display_name, public_profile")
    .eq("id", userId)
    .maybeSingle();

  if (readError) throw readError;

  if (!existing) {
    const { data, error } = await client
      .from("profiles")
      .insert({
        id: userId,
        username: safeUsername,
        display_name: null,
        locale: "en",
        public_profile: false
      })
      .select("id, username, display_name, public_profile")
      .single();

    if (error) throw error;

    return {
      id: data.id,
      username: data.username,
      displayName: data.display_name,
      publicProfile: data.public_profile
    };
  }

  if (username && existing.username !== safeUsername) {
    const { data, error } = await client
      .from("profiles")
      .update({ username: safeUsername })
      .eq("id", userId)
      .select("id, username, display_name, public_profile")
      .single();

    if (error) throw error;

    return {
      id: data.id,
      username: data.username,
      displayName: data.display_name,
      publicProfile: data.public_profile
    };
  }

  return {
    id: existing.id,
    username: existing.username,
    displayName: existing.display_name,
    publicProfile: existing.public_profile
  };
}

export async function setPublicProfile(publicProfile: boolean) {
  const client = assertSupabase();
  const profile = await ensureCommunityProfile();

  const { data, error } = await client
    .from("profiles")
    .update({ public_profile: publicProfile })
    .eq("id", profile.id)
    .select("id, username, display_name, public_profile")
    .single();

  if (error) throw error;

  return {
    id: data.id,
    username: data.username,
    displayName: data.display_name,
    publicProfile: data.public_profile
  };
}


