import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface WhatsAppRequest {
  phone: string;
  message: string;
  purpose: "order_update" | "welcome" | "campaign" | "abandoned_cart" | "test";
  media_url?: string;
  media_type?: "image" | "video" | "document";
  link_url?: string;
  link_text?: string;
  variables?: Record<string, string>;
}

interface WhatsAppSettings {
  provider: string;
  is_enabled: boolean;
  api_key: string;
  phone_number_id: string;
  business_account_id: string;
  webhook_verify_token: string;
  order_updates_enabled: boolean;
  welcome_msg_enabled: boolean;
  abandoned_cart_enabled: boolean;
  support_chat_enabled: boolean;
  config: Record<string, unknown>;
}

// ────── WhatsApp Business API (Meta) ──────
async function sendViaMeta(
  settings: WhatsAppSettings,
  phone: string,
  message: string,
  media?: { url: string; type: string },
  link?: { url: string; text: string }
): Promise<{ success: boolean; error?: string; message_id?: string }> {
  try {
    const url = `https://graph.facebook.com/v21.0/${settings.phone_number_id}/messages`;

    // Build message payload
    let payload: Record<string, unknown>;

    if (media?.url && media?.type) {
      // Media message with caption
      const mediaType = media.type === "document" ? "document" : media.type === "video" ? "video" : "image";
      payload = {
        messaging_product: "whatsapp",
        to: phone.replace(/^\+/, ""),
        type: mediaType,
        [mediaType]: {
          link: media.url,
          caption: message,
          ...(mediaType === "document" ? { filename: media.url.split("/").pop() || "document" } : {}),
        },
      };
    } else {
      // Text message (or interactive with button)
      if (link?.url && link?.text) {
        payload = {
          messaging_product: "whatsapp",
          to: phone.replace(/^\+/, ""),
          type: "interactive",
          interactive: {
            type: "cta_url",
            body: { text: message },
            action: {
              name: "cta_url",
              parameters: {
                display_text: link.text,
                url: link.url,
              },
            },
          },
        };
      } else {
        payload = {
          messaging_product: "whatsapp",
          to: phone.replace(/^\+/, ""),
          type: "text",
          text: { body: message },
        };
      }
    }

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${settings.api_key}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (res.ok && data.messages?.[0]?.id) {
      return { success: true, message_id: data.messages[0].id };
    }
    const errMsg = data.error?.message || data.error?.error_data?.details || `Meta API error [${res.status}]`;
    return { success: false, error: errMsg };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown Meta API error";
    return { success: false, error: msg };
  }
}

// ────── Twilio WhatsApp ──────
async function sendViaTwilioWhatsApp(
  settings: WhatsAppSettings,
  phone: string,
  message: string,
  media?: { url: string; type: string }
): Promise<{ success: boolean; error?: string; message_id?: string }> {
  try {
    // phone_number_id = Account SID, business_account_id = Auth Token, config.from_number = Twilio WA number
    const accountSid = settings.phone_number_id;
    const authToken = settings.business_account_id;
    const fromNumber = (settings.config as Record<string, string>)?.from_number || "";

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const params = new URLSearchParams({
      To: `whatsapp:${phone}`,
      From: `whatsapp:${fromNumber}`,
      Body: message,
    });

    if (media?.url) {
      params.append("MediaUrl", media.url);
    }

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + btoa(`${accountSid}:${authToken}`),
      },
      body: params.toString(),
    });

    const data = await res.json();
    if (res.ok || res.status === 201) {
      return { success: true, message_id: data.sid };
    }
    return { success: false, error: data.message || `Twilio WA error [${res.status}]` };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown Twilio WA error";
    return { success: false, error: msg };
  }
}

// ────── WATI ──────
async function sendViaWATI(
  settings: WhatsAppSettings,
  phone: string,
  message: string,
  media?: { url: string; type: string }
): Promise<{ success: boolean; error?: string; message_id?: string }> {
  try {
    const baseUrl = (settings.config as Record<string, string>)?.api_endpoint || "https://live-server-114876.wati.io";
    const cleanPhone = phone.replace(/^\+/, "");

    if (media?.url) {
      const url = `${baseUrl}/api/v1/sendSessionFile/${cleanPhone}`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${settings.api_key}`,
        },
        body: JSON.stringify({
          url: media.url,
          caption: message,
        }),
      });
      const data = await res.json();
      if (data.result === true || res.ok) {
        return { success: true, message_id: data.info || "" };
      }
      return { success: false, error: data.info || `WATI error [${res.status}]` };
    } else {
      const url = `${baseUrl}/api/v1/sendSessionMessage/${cleanPhone}`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${settings.api_key}`,
        },
        body: JSON.stringify({ messageText: message }),
      });
      const data = await res.json();
      if (data.result === true || res.ok) {
        return { success: true, message_id: data.info || "" };
      }
      return { success: false, error: data.info || `WATI error [${res.status}]` };
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown WATI error";
    return { success: false, error: msg };
  }
}

// ────── Interakt ──────
async function sendViaInterakt(
  settings: WhatsAppSettings,
  phone: string,
  message: string,
  media?: { url: string; type: string }
): Promise<{ success: boolean; error?: string; message_id?: string }> {
  try {
    const url = "https://api.interakt.ai/v1/public/message/";
    const payload: Record<string, unknown> = {
      countryCode: phone.startsWith("+") ? phone.slice(1, phone.length - 10) : "91",
      phoneNumber: phone.replace(/^\+\d{1,3}/, ""),
      type: "Text",
      data: { message },
    };

    if (media?.url) {
      const typeMap: Record<string, string> = { image: "Image", video: "Video", document: "Document" };
      payload.type = typeMap[media.type] || "Image";
      payload.data = { ...payload.data as Record<string, unknown>, url: media.url, caption: message };
    }

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${settings.api_key}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (data.result === true || res.ok) {
      return { success: true, message_id: data.id || "" };
    }
    return { success: false, error: data.message || `Interakt error [${res.status}]` };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown Interakt error";
    return { success: false, error: msg };
  }
}

// ────── Router ──────
async function sendWhatsApp(
  settings: WhatsAppSettings,
  phone: string,
  message: string,
  media?: { url: string; type: string },
  link?: { url: string; text: string }
): Promise<{ success: boolean; error?: string; message_id?: string }> {
  switch (settings.provider) {
    case "whatsapp_business":
      return sendViaMeta(settings, phone, message, media, link);
    case "twilio_whatsapp":
      return sendViaTwilioWhatsApp(settings, phone, message, media);
    case "wati":
      return sendViaWATI(settings, phone, message, media);
    case "interakt":
      return sendViaInterakt(settings, phone, message, media);
    default:
      return { success: false, error: `Unsupported WhatsApp provider: ${settings.provider}` };
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
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role client for DB operations
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Authorization: only admin users may invoke this endpoint to prevent
    // arbitrary outbound messaging at the company's expense.
    const callerId = (claimsData.claims as any).sub as string;
    const { data: roleRow } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ success: false, error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request
    const body: WhatsAppRequest = await req.json();
    const { phone, message, purpose, media_url, media_type, link_url, link_text } = body;

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

    if (message.length > 4096) {
      return new Response(JSON.stringify({ success: false, error: "Message too long (max 4096 chars)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch WhatsApp settings
    const { data: settings, error: settingsError } = await adminClient
      .from("whatsapp_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (settingsError || !settings) {
      return new Response(JSON.stringify({ success: false, error: "WhatsApp not configured" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!settings.is_enabled && purpose !== "test") {
      return new Response(JSON.stringify({ success: false, error: "WhatsApp service is disabled" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check purpose-specific toggles
    if (purpose === "order_update" && !settings.order_updates_enabled) {
      return new Response(JSON.stringify({ success: false, error: "WhatsApp order updates disabled" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (purpose === "welcome" && !settings.welcome_msg_enabled) {
      return new Response(JSON.stringify({ success: false, error: "WhatsApp welcome messages disabled" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (purpose === "abandoned_cart" && !settings.abandoned_cart_enabled) {
      return new Response(JSON.stringify({ success: false, error: "Abandoned cart WhatsApp disabled" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!settings.api_key) {
      return new Response(JSON.stringify({ success: false, error: "WhatsApp API key not configured" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build media/link objects
    const media = media_url && media_type ? { url: media_url, type: media_type } : undefined;
    const link = link_url && link_text ? { url: link_url, text: link_text } : undefined;

    // Send WhatsApp via configured provider
    const result = await sendWhatsApp(settings as WhatsAppSettings, phone, message, media, link);

    const status = result.success ? 200 : 500;
    return new Response(JSON.stringify(result), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    console.error("send-whatsapp error:", err);
    const errorMsg = err instanceof Error ? err.message : "Internal server error";
    return new Response(JSON.stringify({ success: false, error: errorMsg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
