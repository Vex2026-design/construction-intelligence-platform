import { supabase } from "./supabase";

export async function getUsers() {
  if (!supabase) {
    return [
      { id: "demo-ipp", email: "demo.ipp@company.com", full_name: "Demo IPP PM", company: "IPP", role: "admin", active: true },
      { id: "demo-epc", email: "demo.epc@epc.com", full_name: "Demo EPC PM", company: "EPC", role: "epc_pm", active: true }
    ];
  }

  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getProjectAccess(userId) {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("project_user_access")
    .select("*")
    .eq("user_id", userId);

  if (error) throw error;
  return data || [];
}

export async function upsertUserProfile(profile, projectCodes = []) {
  if (!supabase) throw new Error("Supabase non configurato.");

  const { data, error } = await supabase
    .from("user_profiles")
    .upsert({
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      company: profile.company,
      role: profile.role,
      active: profile.active
    })
    .select("*")
    .single();

  if (error) throw error;

  await supabase.from("project_user_access").delete().eq("user_id", profile.id);

  if (projectCodes.length) {
    const payload = projectCodes.map((code) => ({
      user_id: profile.id,
      project_code: code,
      access_level: profile.role?.includes("epc") || profile.role === "site_manager" ? "write_weekly" : "read"
    }));

    const { error: accessError } = await supabase.from("project_user_access").insert(payload);
    if (accessError) throw accessError;
  }

  return data;
}

export async function deactivateUser(userId) {
  if (!supabase) throw new Error("Supabase non configurato.");

  const { error } = await supabase
    .from("user_profiles")
    .update({ active: false })
    .eq("id", userId);

  if (error) throw error;
}

/*
  Nota importante:
  creare utenti Supabase Auth dal browser NON è sicuro con anon key.
  La creazione vera email/password va fatta con una Edge Function usando SUPABASE_SERVICE_ROLE_KEY.
*/
export async function inviteUserByEmail(payload) {
  if (!supabase) {
    return { demo: true };
  }

  const { data, error } = await supabase.functions.invoke("admin-invite-user", {
    body: payload
  });

  if (error) throw error;
  return data;
}
