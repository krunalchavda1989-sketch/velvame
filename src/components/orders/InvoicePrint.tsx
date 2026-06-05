import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface InvoiceProps {
  orderId: string;
  order: {
    id: string;
    total_amount: number;
    status: string;
    payment_method: string | null;
    shipping_address: any;
    created_at: string;
    is_repurchase: boolean;
  };
  items: {
    id: string;
    quantity: number;
    price: number;
    product: { name: string; category: string } | null;
  }[];
  payment: {
    razorpay_payment_id: string | null;
    amount: number;
  } | null;
  customerName?: string;
  customerPhone?: string;
}

// Escape user-controlled values before interpolation into HTML to prevent XSS.
const escapeHtml = (val: unknown): string => {
  if (val === null || val === undefined) return "";
  return String(val)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

const buildInvoiceHtml = (params: {
  invoiceNo: string;
  brand: any;
  localization: any;
  order: InvoiceProps["order"];
  items: InvoiceProps["items"];
  payment: InvoiceProps["payment"];
  customerName?: string;
  customerPhone?: string;
}) => {
  const { invoiceNo, brand, localization, order, items, payment, customerName, customerPhone } = params;
  const sym = localization?.currency_symbol || "₹";
  const taxEnabled = localization?.tax_enabled ?? false;
  const taxRateVal = Number(localization?.tax_rate) || 0;
  const taxLbl = localization?.tax_label || "GST";
  const e = escapeHtml;
  const fmt = (v: number) => `${e(sym)}${(Number(v) || 0).toFixed(2)}`;
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const taxAmt = taxEnabled ? (subtotal * taxRateVal) / 100 : 0;
  const shippingAddr = order.shipping_address || {};
  const taxRow = taxEnabled
    ? `<div class="summary-row"><span>${e(taxLbl)} (${e(taxRateVal)}%)</span><span>${fmt(taxAmt)}</span></div>`
    : "";

  const cityLine = [shippingAddr.city, shippingAddr.state, shippingAddr.pincode]
    .filter(Boolean)
    .map((v: any) => e(v))
    .join(", ");

  const phoneShown = shippingAddr.phone || customerPhone;
  const paidStatus = payment?.razorpay_payment_id ? "Paid" : "Pending";
  const badgeClass = payment?.razorpay_payment_id ? "badge-paid" : "badge-pending";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice ${e(invoiceNo)}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #1a1a1a; background: #fff; padding: 40px; max-width: 800px; margin: 0 auto; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #111; }
        .brand-name { font-size: 24px; font-weight: 700; color: #111; }
        .brand-details { font-size: 11px; color: #666; margin-top: 4px; line-height: 1.6; }
        .invoice-title { font-size: 28px; font-weight: 700; color: #111; text-align: right; }
        .invoice-meta { font-size: 11px; color: #666; text-align: right; margin-top: 4px; line-height: 1.6; }
        .addresses { display: flex; justify-content: space-between; margin-bottom: 32px; gap: 24px; }
        .address-block { flex: 1; }
        .address-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #999; margin-bottom: 8px; }
        .address-text { font-size: 12px; line-height: 1.6; color: #333; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        thead th { background: #111; color: #fff; padding: 10px 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; }
        thead th:last-child, thead th:nth-child(3), thead th:nth-child(4) { text-align: right; }
        tbody td { padding: 12px; font-size: 12px; border-bottom: 1px solid #eee; }
        tbody td:last-child, tbody td:nth-child(3), tbody td:nth-child(4) { text-align: right; }
        .summary { display: flex; justify-content: flex-end; margin-bottom: 32px; }
        .summary-table { width: 260px; }
        .summary-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 12px; color: #555; }
        .summary-total { display: flex; justify-content: space-between; padding: 10px 0; font-size: 16px; font-weight: 700; color: #111; border-top: 2px solid #111; margin-top: 4px; }
        .footer { text-align: center; padding-top: 24px; border-top: 1px solid #eee; font-size: 11px; color: #999; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; text-transform: uppercase; }
        .badge-paid { background: #dcfce7; color: #166534; }
        .badge-pending { background: #fef9c3; color: #854d0e; }
        @media print { body { padding: 20px; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="brand-name">${e(brand?.brand_name || "Store")}</div>
          <div class="brand-details">
            ${brand?.email ? e(brand.email) + "<br>" : ""}
            ${brand?.phone ? e(brand.phone) + "<br>" : ""}
            ${brand?.gst_number ? "GST: " + e(brand.gst_number) + "<br>" : ""}
            ${e(brand?.address || "")}
          </div>
        </div>
        <div>
          <div class="invoice-title">INVOICE</div>
          <div class="invoice-meta">
            ${e(invoiceNo)}<br>
            Date: ${e(formatDate(order.created_at))}<br>
            ${payment?.razorpay_payment_id ? "Txn: " + e(payment.razorpay_payment_id) : ""}
          </div>
        </div>
      </div>

      <div class="addresses">
        <div class="address-block">
          <div class="address-label">Bill To</div>
          <div class="address-text">
            ${e(shippingAddr.name || customerName || "—")}<br>
            ${shippingAddr.address ? e(shippingAddr.address) + "<br>" : ""}
            ${cityLine}
            ${phoneShown ? "<br>📞 " + e(phoneShown) : ""}
          </div>
        </div>
        <div class="address-block">
          <div class="address-label">Payment</div>
          <div class="address-text">
            Method: ${e(order.payment_method || "—")}<br>
            Status: <span class="badge ${badgeClass}">${paidStatus}</span>
          </div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Item</th>
            <th>Price</th>
            <th>Qty</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((item, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${e(item.product?.name || "Unknown Product")}</td>
              <td>${fmt(item.price)}</td>
              <td>${e(item.quantity)}</td>
              <td>${fmt(item.price * item.quantity)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>

      <div class="summary">
        <div class="summary-table">
          <div class="summary-row"><span>Subtotal</span><span>${fmt(subtotal)}</span></div>
          ${taxRow}
          <div class="summary-row"><span>Shipping</span><span>Free</span></div>
          <div class="summary-total"><span>Total</span><span>${fmt(order.total_amount)}</span></div>
        </div>
      </div>

      <div class="footer">
        Thank you for your business!<br>
        ${e(brand?.brand_name || "Store")} ${brand?.website ? "• " + e(brand.website) : ""}
      </div>
    </body>
    </html>
  `;
};

const InvoicePrint = ({ orderId, order, items, payment, customerName, customerPhone }: InvoiceProps) => {
  const [brand, setBrand] = useState<any>(null);
  const [localization, setLocalization] = useState<any>(null);

  useEffect(() => {
    supabase.from("brand_settings").select("*").limit(1).single().then(({ data }) => {
      if (data) setBrand(data);
    });
    supabase.from("localization_settings").select("*").limit(1).single().then(({ data }) => {
      if (data) setLocalization(data);
    });
  }, []);

  const invoiceNo = `INV-${orderId.slice(0, 8).toUpperCase()}`;

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const html = buildInvoiceHtml({ invoiceNo, brand, localization, order, items, payment, customerName, customerPhone });
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
  };

  return { handlePrint };
};

export default InvoicePrint;

// Hook version for easy usage
export const useInvoicePrint = (props: InvoiceProps) => {
  const [brand, setBrand] = useState<any>(null);
  const [localization, setLocalization] = useState<any>(null);

  useEffect(() => {
    supabase.from("brand_settings").select("*").limit(1).single().then(({ data }) => {
      if (data) setBrand(data);
    });
    supabase.from("localization_settings").select("*").limit(1).single().then(({ data }) => {
      if (data) setLocalization(data);
    });
  }, []);

  const { orderId, order, items, payment, customerName, customerPhone } = props;
  const invoiceNo = `INV-${orderId.slice(0, 8).toUpperCase()}`;

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const html = buildInvoiceHtml({ invoiceNo, brand, localization, order, items, payment, customerName, customerPhone });
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
  };

  return { handlePrint };
};
