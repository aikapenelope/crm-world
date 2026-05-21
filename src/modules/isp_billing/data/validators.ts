import { z } from 'zod'

const INVOICE_STATUSES = ['pending', 'partial', 'paid', 'overdue', 'cancelled', 'in_dispute'] as const
const PAYMENT_METHODS = ['zelle', 'pago_movil', 'efectivo_usd', 'efectivo_ves', 'transferencia', 'binance', 'otro'] as const
const CURRENCIES = ['USD', 'VES', 'USDT', 'EUR'] as const

// ---------------------------------------------------------------------------
// Invoices
// ---------------------------------------------------------------------------

export const createInvoiceSchema = z.object({
  subscriber_id: z.string().uuid(),
  invoice_number: z.string().min(1).max(30),
  control_number: z.string().max(30).nullable().optional(),
  period_month: z.string().regex(/^\d{4}-\d{2}$/, 'Formato: YYYY-MM'),
  issue_date: z.string().date(),
  due_date: z.string().date(),
  base_amount_usd: z.string().regex(/^\d+(\.\d{1,2})?$/),
  addons_amount_usd: z.string().regex(/^\d+(\.\d{1,2})?$/).default('0.00'),
  discount_amount_usd: z.string().regex(/^\d+(\.\d{1,2})?$/).default('0.00'),
  subtotal_usd: z.string().regex(/^\d+(\.\d{1,2})?$/),
  iva_rate: z.string().regex(/^\d+(\.\d{1,2})?$/).default('16.00'),
  iva_amount_ves: z.string().regex(/^\d+(\.\d{1,2})?$/).nullable().optional(),
  bcv_rate: z.string().regex(/^\d+(\.\d{1,4})?$/).nullable().optional(),
  total_usd: z.string().regex(/^\d+(\.\d{1,2})?$/),
  total_ves: z.string().nullable().optional(),
  balance_usd: z.string().regex(/^\d+(\.\d{1,2})?$/),
  notes: z.string().nullable().optional(),
})

export const updateInvoiceSchema = createInvoiceSchema.partial()

export const changeInvoiceStatusSchema = z.object({
  invoice_id: z.string().uuid(),
  status: z.enum(INVOICE_STATUSES),
  notes: z.string().nullable().optional(),
})

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------

export const registerPaymentSchema = z.object({
  invoice_id: z.string().uuid(),
  subscriber_id: z.string().uuid(),
  payment_date: z.string().date(),
  amount_usd: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Monto inválido'),
  currency: z.enum(CURRENCIES).default('USD'),
  payment_method: z.enum(PAYMENT_METHODS),
  reference_number: z.string().max(100).nullable().optional(),
  igtf_applies: z.boolean().default(false),
  bcv_rate_at_payment: z.string().regex(/^\d+(\.\d{1,4})?$/).nullable().optional(),
  amount_ves: z.string().nullable().optional(),
  photo_receipt_url: z.string().url().nullable().optional(),
  notes: z.string().nullable().optional(),
})

export type RegisterPaymentInput = z.infer<typeof registerPaymentSchema>
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>
