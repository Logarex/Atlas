import { supabase } from "@/lib/supabase";

function emailForUsername(username: string) {
  return `${username.trim().toLowerCase()}@atlas.internal`;
}

export async function signInWithUsername(username: string, code: string) {
  if (!supabase) throw new Error("Supabase not configured");

  const email = emailForUsername(username);
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: code,
  });

  if (error) throw error;

  return data;
}

export async function signUpWithUsername(username: string, code: string) {
  if (!supabase) throw new Error("Supabase not configured");

  const email = emailForUsername(username);

  const { data, error } = await supabase.auth.signUp({
    email,
    password: code,
    options: {
      data: {
        username: username.trim()
      }
    }
  });

  if (error) throw error;

  return data;
}

export async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function deleteAccount() {
  if (!supabase) throw new Error("Supabase not configured");
  
  const { error } = await supabase.rpc("delete_own_user");
  if (error) throw error;
  
  await signOut();
}
