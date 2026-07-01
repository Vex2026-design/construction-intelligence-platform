import { supabase } from "./supabase";

export async function getSession() {
  if (!supabase) return { user: null, profile: null };

  const { data } = await supabase.auth.getSession();
  const user = data?.session?.user || null;
  if (!user) return { user: null, profile: null };

  const profile = await getProfile(user.id, user.email);
  return { user, profile };
}

export async function signIn(email, password) {
  if (!supabase) {
    return {
      user: { id: "demo-user", email },
      profile: {
        id: "demo-user",
        email,
        full_name: email.includes("epc") ? "Demo EPC User" : "Demo IPP User",
        role: email.includes("epc") ? "epc_pm" : "admin"
      }
    };
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;

  const user = data?.user;
  const profile = await getProfile(user.id, user.email);
  return { user, profile };
}

export async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function getProfile(userId, email) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.warn("profile error", error);
  }

  if (data) return data;

  // Auto-create first profile as admin fallback
  const { data: inserted } = await supabase
    .from("user_profiles")
    .insert({
      id: userId,
      email,
      full_name: email,
      role: "admin"
    })
    .select("*")
    .maybeSingle();

  return inserted || {
    id: userId,
    email,
    full_name: email,
    role: "admin"
  };
}

export function roleToPortal(role) {
  if (["epc_pm", "site_manager"].includes(role)) return "epc";
  return "ipp";
}

export function canAccessIpp(role) {
  return ["admin", "pm_ipp", "director", "viewer"].includes(role);
}

export function canAccessEpc(role) {
  return ["admin", "epc_pm", "site_manager"].includes(role);
}
