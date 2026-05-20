/**
 * Auto Shop Receipt Generator.
 * Generates HTML receipt for payment confirmation (shareable via WhatsApp).
 */

export type AutoReceiptData = {
  shopName: string
  shopLogo?: string | null
  orderNumber: string
  vehicleLabel: string
  plate: string
  customerName: string
  concept: string
  amount: string
  currency: string
  paymentMethod: string
  reference: string | null
  paymentDate: string
  exchangeRate: string | null
  amountVes: string | null
  receiptNumber: string
  generatedAt: string
}

export function generateAutoReceiptHtml(data: AutoReceiptData): string {
  const refLine = data.reference
    ? `<tr><td style="padding:4px 0;color:#6b7280;">Referencia:</td><td style="padding:4px 0;font-weight:600;">${esc(data.reference)}</td></tr>`
    : ''

  const vesLine = data.exchangeRate && data.amountVes
    ? `<tr><td style="padding:4px 0;color:#6b7280;">Equivalente:</td><td style="padding:4px 0;">VES ${esc(data.amountVes)} (tasa BCV: ${esc(data.exchangeRate)})</td></tr>`
    : ''

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="width:400px;background:white;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
  <div style="background:#1e3a5f;color:white;padding:20px;text-align:center;">
    <div style="font-size:16px;font-weight:700;">${esc(data.shopName)}</div>
    <div style="font-size:11px;opacity:0.8;margin-top:4px;">RECIBO DE PAGO — TALLER</div>
    <div style="font-size:12px;opacity:0.7;margin-top:4px;">N° ${esc(data.receiptNumber)}</div>
  </div>
  <div style="padding:16px 20px;border-bottom:1px solid #e5e7eb;background:#f9fafb;">
    <div style="font-size:14px;font-weight:600;">${esc(data.customerName)}</div>
    <div style="font-size:12px;color:#6b7280;margin-top:2px;">${esc(data.vehicleLabel)} — ${esc(data.plate)}</div>
  </div>
  <div style="padding:16px 20px;">
    <table style="width:100%;font-size:13px;border-collapse:collapse;">
      <tr><td style="padding:4px 0;color:#6b7280;">Orden:</td><td style="padding:4px 0;font-weight:600;">${esc(data.orderNumber)}</td></tr>
      <tr><td style="padding:4px 0;color:#6b7280;">Concepto:</td><td style="padding:4px 0;">${esc(data.concept)}</td></tr>
      <tr><td style="padding:4px 0;color:#6b7280;">Monto:</td><td style="padding:4px 0;font-size:18px;font-weight:700;color:#059669;">${esc(data.currency)} ${esc(data.amount)}</td></tr>
      ${vesLine}
      <tr><td style="padding:4px 0;color:#6b7280;">Método:</td><td style="padding:4px 0;">${esc(data.paymentMethod)}</td></tr>
      ${refLine}
      <tr><td style="padding:4px 0;color:#6b7280;">Fecha:</td><td style="padding:4px 0;">${esc(data.paymentDate)}</td></tr>
    </table>
  </div>
  <div style="padding:12px 20px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
    <div style="font-size:10px;color:#9ca3af;">Generado: ${esc(data.generatedAt)}</div>
  </div>
</div>
</body></html>`
}

function esc(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
