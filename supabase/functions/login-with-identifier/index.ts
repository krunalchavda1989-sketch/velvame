import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { identifier, password } = await req.json();

    const normalizedIdentifier = typeof identifier === "string" ? identifier.trim() : "";
    const normalizedPassword = typeof password === "string" ? password : "";

    if (!normalizedIdentifier || !normalizedPassword) {
      return json({
        success: false,
        error: "Email or referral ID and password are required.",
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const serviceClient = createClient(supabaseUrl, serviceRoleKey);
    const authClient = createClient(supabaseUrl, anonKey);

    let email = normalizedIdentifier;

    if (!normalizedIdentifier.includes("@")) {
      const { data: profile, error: profileError } = await serviceClient
        .from("profiles")
        .select("user_id")
        .eq("referral_code", normalizedIdentifier.toUpperCase())
        .maybeSingle();

      if (profileError || !profile?.user_id) {
        return json({ success: false, error: "Invalid login credentials." });
      }

      const { data: userData, error: userError } = await serviceClient.auth.admin.getUserById(profile.user_id);
      const resolvedEmail = userData?.user?.email?.trim();

      if (userError || !resolvedEmail) {
        return json({ success: false, error: "Invalid login credentials." });
      }

      email = resolvedEmail;
    }

    const { data, error } = await authClient.auth.signInWithPassword({
      email: email.toLowerCase(),
      password: normalizedPassword,
    });

    if (error || !data.session) {
      return json({
        success: false,
        error: error?.message || "Invalid login credentials.",
      });
    }

    return json({
      success: true,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      },
    });
  } catch (_error) {
    return json({
      success: false,
      error: "Unable to sign in right now. Please try again.",
    });
  }
});
