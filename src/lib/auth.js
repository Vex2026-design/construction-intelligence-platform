import { supabase } from "./supabase";

export function portalForRole(role) {
  return ["epc_pm", "site_manager"].includes(role) ? "epc" : "ipp";
}

export async function getSession() {
  if (!supabase) return { user: null, profile: null };

  const { data } = await supabase.auth.getSession();
  const user = data?.session?.user || null;
  if (!user) return { user: null, profile: null };

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return {
    user,
    profile: profile || {
      id: user.id,
      email: user.email,
      fullName: user.email,
      role: "admin"
    }
  };
}

export async function login(email, password) {
  if (!supabase) {
    const isEpc = email.toLowerCase().includes("epc");
    return {
      user: { id: isEpc ? "demo-epc" : "demo-ipp", email },
      profile: {
        id: isEpc ? "demo-epc" : "demo-ipp",
        email,
        fullName: isEpc ? "Demo EPC" : "Demo IPP Admin",
        role: isEpc ? "epc_pm" : "admin",
        company: isEpc ? "EPC" : "IPP"
      }
    };
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", data.user.id)
    .maybeSingle();

  return {
    user: data.user,
    profile: profile || {
      id: data.user.id,
      email: data.user.email,
      fullName: data.user.email,
      role: "admin"
    }
  };
}

export async function logout() {
  if (supabase) await supabase.auth.signOut();
}
