/**
 * Receipt Image Generator
 *
 * Generates a PNG image of a payment receipt that can be shared via WhatsApp.
 * Uses HTML → SVG → PNG pipeline (satori-compatible approach).
 *
 * The receipt includes:
 * - Tenant branding (logo + name from directory/organization)
 * - Student name, grade, section
 * - Payment details (amount, currency, method, reference, date)
 * - Receipt number (sequential per tenant)
 * - Verification QR or code
 *
 * The image is stored as an attachment and linked to the payment record.
 */

export type ReceiptData = {
  // Branding
  schoolName: string
  schoolLogo?: string | null // URL or base64

  // Student
  studentName: string
  gradeLabel: string
  section: string

  // Payment
  receiptNumber: string
  concept: string
  amount: string
  currency: string
  paymentMethod: string
  reference: string | null
  paymentDate: string
  exchangeRate: string | null
  amountLocal: string | null

  // Meta
  generatedAt: string
  verificationCode: string
}

/**
 * Generates HTML for the receipt.
 * This HTML is designed to be rendered as an image (fixed width, inline styles).
 */
export function generateReceiptHtml(data: ReceiptData): string {
  const refLine = data.reference
    ? `<tr><td style="padding:4px 0;color:#6b7280;">Referencia:</td><td style="padding:4px 0;font-weight:600;">${escapeHtml(data.reference)}</td></tr>`
    : ''

  const rateLine = data.exchangeRate && data.amountLocal
    ? `<tr><td style="padding:4px 0;color:#6b7280;">Equivalente:</td><td style="padding:4px 0;">VES ${escapeHtml(data.amountLocal)} (tasa: ${escapeHtml(data.exchangeRate)})</td></tr>`
    : ''

  const logoHtml = data.schoolLogo
    ? `<img src="${escapeHtml(data.schoolLogo)}" alt="Logo" style="width:60px;height:60px;object-fit:contain;border-radius:8px;" />`
    : `<div style="width:60px;height:60px;background:#e5e7eb;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:bold;color:#6b7280;">${data.schoolName.charAt(0)}</div>`

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="width:400px;background:white;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
  <!-- Header -->
  <div style="background:#1e40af;color:white;padding:20px;text-align:center;">
    <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:8px;">
      ${logoHtml}
      <div>
        <div style="font-size:16px;font-weight:700;">${escapeHtml(data.schoolName)}</div>
        <div style="font-size:11px;opacity:0.8;">RECIBO DE PAGO</div>
      </div>
    </div>
    <div style="font-size:12px;opacity:0.7;">N° ${escapeHtml(data.receiptNumber)}</div>
  </div>

  <!-- Student Info -->
  <div style="padding:16px 20px;border-bottom:1px solid #e5e7eb;background:#f9fafb;">
    <div style="font-size:14px;font-weight:600;color:#111827;">${escapeHtml(data.studentName)}</div>
    <div style="font-size:12px;color:#6b7280;margin-top:2px;">${escapeHtml(data.gradeLabel)} — Sección ${escapeHtml(data.section)}</div>
  </div>

  <!-- Payment Details -->
  <div style="padding:16px 20px;">
    <table style="width:100%;font-size:13px;border-collapse:collapse;">
      <tr><td style="padding:4px 0;color:#6b7280;">Concepto:</td><td style="padding:4px 0;font-weight:600;">${escapeHtml(data.concept)}</td></tr>
      <tr>
        <td style="padding:4px 0;color:#6b7280;">Monto:</td>
        <td style="padding:4px 0;font-size:18px;font-weight:700;color:#059669;">${escapeHtml(data.currency)} ${escapeHtml(data.amount)}</td>
      </tr>
      ${rateLine}
      <tr><td style="padding:4px 0;color:#6b7280;">Método:</td><td style="padding:4px 0;">${escapeHtml(data.paymentMethod)}</td></tr>
      ${refLine}
      <tr><td style="padding:4px 0;color:#6b7280;">Fecha:</td><td style="padding:4px 0;">${escapeHtml(data.paymentDate)}</td></tr>
    </table>
  </div>

  <!-- Footer -->
  <div style="padding:12px 20px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
    <div style="font-size:10px;color:#9ca3af;">Código de verificación: ${escapeHtml(data.verificationCode)}</div>
    <div style="font-size:10px;color:#9ca3af;margin-top:4px;">Generado: ${escapeHtml(data.generatedAt)}</div>
  </div>
</div>
</body>
</html>`
}

/**
 * Generate a sequential receipt number for the tenant.
 * Format: REC-YYYYMM-NNNNN
 */
export function generateReceiptNumber(tenantPrefix: string, sequence: number): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const seq = String(sequence).padStart(5, '0')
  return `REC-${year}${month}-${seq}`
}

/**
 * Generate a short verification code from payment ID.
 */
export function generateVerificationCode(paymentId: string): string {
  // Use first 8 chars of UUID as verification code
  return paymentId.replace(/-/g, '').slice(0, 8).toUpperCase()
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
