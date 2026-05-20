import { z } from 'zod'

export const createWithholdingSchema = z.object({
  type: z.enum(['iva', 'islr']),
  period_month: z.string().regex(/^\d{4}-\d{2}$/, 'Formato: YYYY-MM'),
  fortnight: z.coerce.number().min(1).max(2).default(1),
  supplier_rif: z.string().min(1).max(15),
  supplier_name: z.string().min(1).max(255),
  invoice_number: z.string().min(1).max(50),
  invoice_date: z.string().min(1),
  invoice_amount: z.string().min(1),
  tax_amount: z.string().min(1),
  withholding_rate: z.string().min(1),
  withholding_amount: z.string().min(1),
  voucher_number: z.string().max(50).optional().nullable(),
  status: z.enum(['pending', 'applied', 'declared']).default('pending'),
  notes: z.string().max(2000).optional().nullable(),
})

export const updateWithholdingSchema = createWithholdingSchema.partial()

export const listWithholdingsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  search: z.string().optional(),
  type: z.enum(['iva', 'islr']).optional(),
  period_month: z.string().optional(),
  status: z.string().optional(),
}).passthrough()

export type CreateWithholdingInput = z.infer<typeof createWithholdingSchema>
export type UpdateWithholdingInput = z.infer<typeof updateWithholdingSchema>
