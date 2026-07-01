import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { email, full_name, company, role, project_codes = [] } = body;

    const created = await admin.auth.admin.inviteUserByEmail(email, {
      data: { full_name, company, role }
    });

    if (created.error) throw created.error;

    const userId = created.data.user.id;

    await admin.from("user_profiles").upsert({
      id: userId,
      email,
      full_name,
      company,
      role,
      active: true
    });

    if (project_codes.length) {
      await admin.from("project_user_access").insert(
        project_codes.map((project_code: string) => ({
          user_id: userId,
          project_code,
          access_level: role === "epc_pm" || role === "site_manager" ? "write_weekly" : "read"
        }))
      );
    }

    return new Response(JSON.stringify({ ok: true, user_id: userId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
