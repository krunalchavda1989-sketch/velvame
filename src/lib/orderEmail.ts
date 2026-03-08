import { supabase } from "@/integrations/supabase/client";

export type OrderEmailType =
  | "order_success"
  | "order_failed"
  | "order_confirmed"
  | "order_shipped"
  | "order_delivered"
  | "order_cancelled";

export const sendOrderEmail = async (
  orderId: string,
  emailType: OrderEmailType,
  options?: { tracking_number?: string; tracking_url?: string }
) => {
  try {
    const { data, error } = await supabase.functions.invoke("send-order-email", {
      body: {
        order_id: orderId,
        email_type: emailType,
        tracking_number: options?.tracking_number,
        tracking_url: options?.tracking_url,
      },
    });

    if (error) {
      console.error("[Order Email] Invoke error:", error.message);
      return false;
    }

    if (!data?.success) {
      console.error("[Order Email] Failed:", data?.error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[Order Email] Exception:", err);
    return false;
  }
};
