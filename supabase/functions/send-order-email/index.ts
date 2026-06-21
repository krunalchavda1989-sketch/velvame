import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type EmailType =
  | "order_success"
  | "order_failed"
  | "order_confirmed"
  | "order_shipped"
  | "order_delivered"
  | "order_cancelled";

interface EmailPayload {
  order_id: string;
  email_type: EmailType;
  tracking_number?: string;
  tracking_url?: string;
}

const SUBJECT_MAP: Record<EmailType, string> = {
  order_success: "🎉 Order Placed Successfully!",
  order_failed: "❌ Order Payment Failed",
  order_confirmed: "✅ Order Confirmed",
  order_shipped: "🚚 Your Order Has Been Shipped!",
  order_delivered: "📦 Your Order Has Been Delivered!",
  order_cancelled: "❌ Order Cancelled",
};

function buildEmailHtml(
  type: EmailType,
  order: any,
  items: any[],
  profile: any,
  brandName: string,
  tracking?: { number?: string; url?: string }
): string {
  const e = (val: unknown): string => {
    if (val === null || val === undefined) return "";
    return String(val)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  };
  const safeUrl = (url: unknown): string | null => {
    if (!url) return null;
    const s = String(url).trim();
    return /^https:\/\//i.test(s) ? s : null;
  };

  const orderNumber = order.order_number || order.id.slice(0, 8).toUpperCase();
  const total = `₹${Number(order.total_amount).toLocaleString("en-IN")}`;
  const customerName = profile?.full_name || "Customer";
  const orderDate = new Date(order.created_at).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });

  const itemRows = items.map((item: any) => {
    const name = item.product?.name || "Product";
    const qty = item.quantity;
    const price = `₹${Number(item.price).toLocaleString("en-IN")}`;
    return `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#333;">${e(name)}${item.variation_label ? ` (${e(item.variation_label)})` : ""}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#333;text-align:center;">${e(qty)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#333;text-align:right;">${e(price)}</td>
    </tr>`;
  }).join("");

  const trackUrl = safeUrl(tracking?.url);
  const trackNum = tracking?.number ? e(tracking.number) : "";
  const onum = e(orderNumber);
  const messageMap: Record<EmailType, string> = {
    order_success: `Thank you for your order! Your order <strong>#${onum}</strong> has been placed successfully and is being processed.`,
    order_failed: `Unfortunately, the payment for your order <strong>#${onum}</strong> could not be completed. The order has been cancelled. Please try again or contact support.`,
    order_confirmed: `Great news! Your order <strong>#${onum}</strong> has been confirmed and is being prepared for shipment.`,
    order_shipped: `Your order <strong>#${onum}</strong> has been shipped!${trackNum ? ` Your tracking number is <strong>${trackNum}</strong>.` : ""}${trackUrl ? ` <a href="${e(trackUrl)}" style="color:#D4AF37;">Track your shipment here</a>.` : ""}`,
    order_delivered: `Your order <strong>#${onum}</strong> has been delivered successfully. We hope you enjoy your purchase!`,
    order_cancelled: `Your order <strong>#${onum}</strong> has been cancelled. If you have any questions, please contact our support team.`,
  };

  const statusColorMap: Record<EmailType, string> = {
    order_success: "#22c55e",
    order_failed: "#ef4444",
    order_confirmed: "#3b82f6",
    order_shipped: "#a855f7",
    order_delivered: "#22c55e",
    order_cancelled: "#ef4444",
  };

  const statusLabelMap: Record<EmailType, string> = {
    order_success: "Order Placed",
    order_failed: "Payment Failed",
    order_confirmed: "Confirmed",
    order_shipped: "Shipped",
    order_delivered: "Delivered",
    order_cancelled: "Cancelled",
  };

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:20px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <!-- Header -->
        <tr><td style="background:#1a1a2e;padding:24px 32px;text-align:center;">
          <h1 style="margin:0;color:#D4AF37;font-size:22px;font-weight:bold;">${brandName}</h1>
        </td></tr>
        <!-- Status Badge -->
        <tr><td style="padding:24px 32px 0;text-align:center;">
          <span style="display:inline-block;background:${statusColorMap[type]}15;color:${statusColorMap[type]};padding:6px 16px;border-radius:20px;font-size:13px;font-weight:600;border:1px solid ${statusColorMap[type]}30;">
            ${statusLabelMap[type]}
          </span>
        </td></tr>
        <!-- Message -->
        <tr><td style="padding:20px 32px;">
          <p style="font-size:15px;color:#333;line-height:1.6;margin:0 0 6px;">Hi ${customerName},</p>
          <p style="font-size:14px;color:#555;line-height:1.7;margin:0;">${messageMap[type]}</p>
        </td></tr>
        <!-- Order Summary -->
        <tr><td style="padding:0 32px 20px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:8px;overflow:hidden;">
            <tr style="background:#f9f9f9;">
              <td style="padding:10px 12px;font-size:12px;color:#888;font-weight:600;text-transform:uppercase;">Item</td>
              <td style="padding:10px 12px;font-size:12px;color:#888;font-weight:600;text-transform:uppercase;text-align:center;">Qty</td>
              <td style="padding:10px 12px;font-size:12px;color:#888;font-weight:600;text-transform:uppercase;text-align:right;">Price</td>
            </tr>
            ${itemRows}
            <tr style="background:#f9f9f9;">
              <td colspan="2" style="padding:10px 12px;font-size:14px;font-weight:bold;color:#333;">Total</td>
              <td style="padding:10px 12px;font-size:14px;font-weight:bold;color:#D4AF37;text-align:right;">${total}</td>
            </tr>
          </table>
        </td></tr>
        <!-- Order Details -->
        <tr><td style="padding:0 32px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size:12px;color:#888;">Order Number</td>
              <td style="font-size:13px;color:#333;text-align:right;font-weight:600;">#${orderNumber}</td>
            </tr>
            <tr>
              <td style="font-size:12px;color:#888;padding-top:6px;">Order Date</td>
              <td style="font-size:13px;color:#333;text-align:right;padding-top:6px;">${orderDate}</td>
            </tr>
            <tr>
              <td style="font-size:12px;color:#888;padding-top:6px;">Payment Method</td>
              <td style="font-size:13px;color:#333;text-align:right;padding-top:6px;">${order.payment_method || "Online"}</td>
            </tr>
          </table>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f9f9f9;padding:16px 32px;text-align:center;">
          <p style="font-size:12px;color:#999;margin:0;">Thank you for shopping with ${brandName}!</p>
          <p style="font-size:11px;color:#bbb;margin:4px 0 0;">This is an automated email. Please do not reply.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth guard: require valid JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify user and admin role
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: authUser2 }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authUser2) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", authUser2.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { order_id, email_type, tracking_number, tracking_url }: EmailPayload = await req.json();

    if (!order_id || !email_type) {
      return new Response(
        JSON.stringify({ success: false, error: "order_id and email_type are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Load SMTP settings
    const { data: smtpData } = await supabase
      .from("pages_content")
      .select("content")
      .eq("page_slug", "smtp-settings")
      .single();

    if (!smtpData?.content) {
      return new Response(
        JSON.stringify({ success: false, error: "SMTP settings not configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const smtp = smtpData.content as any;

    // Load brand name
    const { data: brandData } = await supabase
      .from("brand_settings")
      .select("brand_name")
      .limit(1)
      .single();
    const brandName = brandData?.brand_name || "Velvame";

    // Fetch order
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .single();
    if (orderErr || !order) {
      return new Response(
        JSON.stringify({ success: false, error: "Order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch order items with product names
    const { data: items } = await supabase
      .from("order_items")
      .select("*, product:products(name, image_url)")
      .eq("order_id", order_id);

    // Fetch user profile & email
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("user_id", order.user_id)
      .single();

    // Get user email from auth
    const { data: authUser } = await supabase.auth.admin.getUserById(order.user_id);
    const userEmail = authUser?.user?.email;

    if (!userEmail) {
      return new Response(
        JSON.stringify({ success: false, error: "User email not found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build email
    const subject = `${SUBJECT_MAP[email_type]} - Order #${order.order_number || order_id.slice(0, 8).toUpperCase()}`;
    const html = buildEmailHtml(
      email_type,
      order,
      items || [],
      profile,
      brandName,
      { number: tracking_number, url: tracking_url }
    );

    // Send via SMTP - prefer env secret over DB-stored password
    const smtpPassword = Deno.env.get("SMTP_PASSWORD") || smtp.smtp_password;
    const client = new SMTPClient({
      connection: {
        hostname: smtp.smtp_host,
        port: Number(smtp.smtp_port) || 587,
        tls: smtp.use_tls !== false,
        auth: {
          username: smtp.smtp_user,
          password: smtpPassword,
        },
      },
    });

    await client.send({
      from: `${smtp.from_name || brandName} <${smtp.from_email || smtp.smtp_user}>`,
      to: userEmail,
      subject,
      content: "Please view this email in an HTML-capable email client.",
      html,
    });

    await client.close();

    console.log(`[Order Email] Sent "${email_type}" for order ${order_id} to ${userEmail}`);

    return new Response(
      JSON.stringify({ success: true, email_type, to: userEmail }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    console.error("[Order Email Error]", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
