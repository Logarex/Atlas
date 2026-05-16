import { supabase } from "@/lib/supabase";

export async function signInWithUsername(username: string, code: string) {
  if (!supabase) throw new Error("Supabase not configured");

  const email = `${username.trim().toLowerCase()}@atlas.internal`;
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: code,
  });

  if (error) {
    // If user doesn't exist, try to sign up
    if (error.message.includes("Invalid login credentials")) {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: code,
        options: {
          data: {
            username: username.trim(),
          }
        }
      });
      if (signUpError) throw signUpError;
      return signUpData;
    }
    throw error;
  }

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
