import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SmsRequest {
  phone: string;
  message: string;
  purpose: "otp" | "order_update" | "welcome" | "test" | "campaign";
  otp?: string;
  order_id?: string;
  variables?: Record<string, string>;
}

interface SmsSettings {
  provider: string;
  is_enabled: boolean;
  api_key: string;
  sender_id: string;
  template_id: string;
  otp_enabled: boolean;
  order_updates_enabled: boolean;
  welcome_sms_enabled: boolean;
}

// ────── MSG91 ──────
async function sendViaMSG91(settings: SmsSettings, phone: string, message: string): Promise<{ success: boolean; error?: string }> {
  try {
    const url = "https://control.msg91.com/api/v5/flow/";
    const body = {
      template_id: settings.template_id,
      sender: settings.sender_id,
      short_url: "0",
      mobiles: phone.replace(/^\+/, ""),
      VAR1: message,
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authkey: settings.api_key,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (res.ok && data.type === "success") {
      return { success: true };
    }
    return { success: false, error: data.message || `MSG91 error [${res.status}]` };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown MSG91 error";
    return { success: false, error: msg };
  }
}

// ────── Twilio ──────
async function sendViaTwilio(settings: SmsSettings, phone: string, message: string): Promise<{ success: boolean; error?: string }> {
  try {
    // For Twilio: api_key = Account SID, sender_id = Auth Token, template_id = From Number
    const accountSid = settings.api_key;
    const authToken = settings.sender_id;
    const fromNumber = settings.template_id;

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const body = new URLSearchParams({
      To: phone,
      From: fromNumber,
      Body: message,
    });

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + btoa(`${accountSid}:${authToken}`),
      },
      body: body.toString(),
    });

    const data = await res.json();
    if (res.ok || res.status === 201) {
      return { success: true };
    }
    return { success: false, error: data.message || `Twilio error [${res.status}]` };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown Twilio error";
    return { success: false, error: msg };
  }
}

// ────── Textlocal ──────
async function sendViaTextlocal(settings: SmsSettings, phone: string, message: string): Promise<{ success: boolean; error?: string }> {
  try {
    const url = "https://api.textlocal.in/send/";
    const body = new URLSearchParams({
      apikey: settings.api_key,
      sender: settings.sender_id,
      numbers: phone.replace(/^\+/, ""),
      message,
    });

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    const data = await res.json();
    if (data.status === "success") {
      return { success: true };
    }
    return { success: false, error: JSON.stringify(data.errors || data.warnings) };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown Textlocal error";
    return { success: false, error: msg };
  }
}

// ────── Fast2SMS ──────
async function sendViaFast2SMS(settings: SmsSettings, phone: string, message: string): Promise<{ success: boolean; error?: string }> {
  try {
    const url = "https://www.fast2sms.com/dev/bulkV2";
    const body = {
      route: "dlt",
      sender_id: settings.sender_id,
      message: settings.template_id,
      variables_values: message,
      flash: 0,
      numbers: phone.replace(/^\+91/, "").replace(/^\+/, ""),
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: settings.api_key,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (data.return === true) {
      return { success: true };
    }
    return { success: false, error: data.message?.[0] || `Fast2SMS error [${res.status}]` };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown Fast2SMS error";
    return { success: false, error: msg };
  }
}

// ────── Router ──────
async function sendSms(settings: SmsSettings, phone: string, message: string): Promise<{ success: boolean; error?: string }> {
  switch (settings.provider) {
    case "msg91":
      return sendViaMSG91(settings, phone, message);
    case "twilio":
      return sendViaTwilio(settings, phone, message);
    case "textlocal":
      return sendViaTextlocal(settings, phone, message);
    case "fast2sms":
      return sendViaFast2SMS(settings, phone, message);
    default:
      return { success: false, error: `Unsupported provider: ${settings.provider}` };
  }
}

// ────── Validation ──────
function isValidPhone(phone: string): boolean {
  return /^\+?[1-9]\d{6,14}$/.test(phone.replace(/[\s-]/g, ""));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Server configuration error");
    }

    // Verify caller is authenticated
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse request
    const body: SmsRequest = await req.json();
    const { phone, message, purpose } = body;

    if (!phone || !message) {
      return new Response(JSON.stringify({ success: false, error: "Phone and message are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!isValidPhone(phone)) {
      return new Response(JSON.stringify({ success: false, error: "Invalid phone number format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (message.length > 500) {
      return new Response(JSON.stringify({ success: false, error: "Message too long (max 500 chars)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch SMS settings
    const { data: settings, error: settingsError } = await supabase
      .from("sms_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (settingsError || !settings) {
      return new Response(JSON.stringify({ success: false, error: "SMS not configured" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!settings.is_enabled && purpose !== "test") {
      return new Response(JSON.stringify({ success: false, error: "SMS service is disabled" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check purpose-specific toggles
    if (purpose === "otp" && !settings.otp_enabled) {
      return new Response(JSON.stringify({ success: false, error: "OTP SMS is disabled" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (purpose === "order_update" && !settings.order_updates_enabled) {
      return new Response(JSON.stringify({ success: false, error: "Order update SMS is disabled" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (purpose === "welcome" && !settings.welcome_sms_enabled) {
      return new Response(JSON.stringify({ success: false, error: "Welcome SMS is disabled" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!settings.api_key) {
      return new Response(JSON.stringify({ success: false, error: "SMS API key not configured" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send SMS via configured provider
    const result = await sendSms(settings as SmsSettings, phone, message);

    const status = result.success ? 200 : 500;
    return new Response(JSON.stringify(result), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    console.error("send-sms error:", err);
    const errorMsg = err instanceof Error ? err.message : "Internal server error";
    return new Response(JSON.stringify({ success: false, error: errorMsg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
