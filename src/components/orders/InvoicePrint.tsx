import { useEffect, useState, useRef } from "react";
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

const InvoicePrint = ({ orderId, order, items, payment, customerName, customerPhone }: InvoiceProps) => {
  const [brand, setBrand] = useState<any>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.from("brand_settings").select("*").limit(1).single().then(({ data }) => {
      if (data) setBrand(data);
    });
  }, []);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(val);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingAddr = order.shipping_address || {};
  const invoiceNo = `INV-${orderId.slice(0, 8).toUpperCase()}`;

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoiceNo}</title>
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
            <div class="brand-name">${brand?.brand_name || "Store"}</div>
            <div class="brand-details">
              ${brand?.email ? brand.email + "<br>" : ""}
              ${brand?.phone ? brand.phone + "<br>" : ""}
              ${brand?.gst_number ? "GST: " + brand.gst_number + "<br>" : ""}
              ${brand?.address || ""}
            </div>
          </div>
          <div>
            <div class="invoice-title">INVOICE</div>
            <div class="invoice-meta">
              ${invoiceNo}<br>
              Date: ${formatDate(order.created_at)}<br>
              ${payment?.razorpay_payment_id ? "Txn: " + payment.razorpay_payment_id : ""}
            </div>
          </div>
        </div>

        <div class="addresses">
          <div class="address-block">
            <div class="address-label">Bill To</div>
            <div class="address-text">
              ${shippingAddr.name || customerName || "—"}<br>
              ${shippingAddr.address ? shippingAddr.address + "<br>" : ""}
              ${[shippingAddr.city, shippingAddr.state, shippingAddr.pincode].filter(Boolean).join(", ")}
              ${shippingAddr.phone || customerPhone ? "<br>📞 " + (shippingAddr.phone || customerPhone) : ""}
            </div>
          </div>
          <div class="address-block">
            <div class="address-label">Payment</div>
            <div class="address-text">
              Method: ${order.payment_method || "—"}<br>
              Status: <span class="badge ${order.status === "delivered" || payment ? "badge-paid" : "badge-pending"}">${payment ? "Paid" : "Pending"}</span>
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
                <td>${item.product?.name || "Unknown Product"}</td>
                <td>${formatCurrency(item.price)}</td>
                <td>${item.quantity}</td>
                <td>${formatCurrency(item.price * item.quantity)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>

        <div class="summary">
          <div class="summary-table">
            <div class="summary-row"><span>Subtotal</span><span>${formatCurrency(subtotal)}</span></div>
            <div class="summary-row"><span>Shipping</span><span>Free</span></div>
            <div class="summary-total"><span>Total</span><span>${formatCurrency(order.total_amount)}</span></div>
          </div>
        </div>

        <div class="footer">
          Thank you for your business!<br>
          ${brand?.brand_name || "Store"} ${brand?.website ? "• " + brand.website : ""}
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 300);
  };

  return { handlePrint };
};

export default InvoicePrint;

// Hook version for easy usage
export const useInvoicePrint = (props: InvoiceProps) => {
  const [brand, setBrand] = useState<any>(null);

  useEffect(() => {
    supabase.from("brand_settings").select("*").limit(1).single().then(({ data }) => {
      if (data) setBrand(data);
    });
  }, []);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(val);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  const { orderId, order, items, payment, customerName, customerPhone } = props;
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingAddr = order.shipping_address || {};
  const invoiceNo = `INV-${orderId.slice(0, 8).toUpperCase()}`;

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoiceNo}</title>
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
            <div class="brand-name">${brand?.brand_name || "Store"}</div>
            <div class="brand-details">
              ${brand?.email ? brand.email + "<br>" : ""}
              ${brand?.phone ? brand.phone + "<br>" : ""}
              ${brand?.gst_number ? "GST: " + brand.gst_number + "<br>" : ""}
              ${brand?.address || ""}
            </div>
          </div>
          <div>
            <div class="invoice-title">INVOICE</div>
            <div class="invoice-meta">
              ${invoiceNo}<br>
              Date: ${formatDate(order.created_at)}<br>
              ${payment?.razorpay_payment_id ? "Txn: " + payment.razorpay_payment_id : ""}
            </div>
          </div>
        </div>

        <div class="addresses">
          <div class="address-block">
            <div class="address-label">Bill To</div>
            <div class="address-text">
              ${shippingAddr.name || customerName || "—"}<br>
              ${shippingAddr.address ? shippingAddr.address + "<br>" : ""}
              ${[shippingAddr.city, shippingAddr.state, shippingAddr.pincode].filter(Boolean).join(", ")}
              ${shippingAddr.phone || customerPhone ? "<br>📞 " + (shippingAddr.phone || customerPhone) : ""}
            </div>
          </div>
          <div class="address-block">
            <div class="address-label">Payment</div>
            <div class="address-text">
              Method: ${order.payment_method || "—"}<br>
              Status: <span class="badge ${payment?.razorpay_payment_id ? "badge-paid" : "badge-pending"}">${payment?.razorpay_payment_id ? "Paid" : "Pending"}</span>
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
                <td>${item.product?.name || "Unknown Product"}</td>
                <td>${formatCurrency(item.price)}</td>
                <td>${item.quantity}</td>
                <td>${formatCurrency(item.price * item.quantity)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>

        <div class="summary">
          <div class="summary-table">
            <div class="summary-row"><span>Subtotal</span><span>${formatCurrency(subtotal)}</span></div>
            <div class="summary-row"><span>Shipping</span><span>Free</span></div>
            <div class="summary-total"><span>Total</span><span>${formatCurrency(order.total_amount)}</span></div>
          </div>
        </div>

        <div class="footer">
          Thank you for your business!<br>
          ${brand?.brand_name || "Store"} ${brand?.website ? "• " + brand.website : ""}
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
  };

  return { handlePrint };
};
