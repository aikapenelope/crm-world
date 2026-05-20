import { z } from 'zod'

export const createEntrySchema = z.object({
  book_type: z.enum(['sales', 'purchases']),
  period_month: z.string().regex(/^\d{4}-\d{2}$/, 'Formato: YYYY-MM'),
  entry_date: z.string().min(1, 'Fecha requerida'),
  document_type: z.enum(['factura', 'nota_credito', 'nota_debito', 'comprobante_retencion']),
  document_number: z.string().min(1).max(50),
  control_number: z.string().max(50).optional().nullable(),
  counterpart_rif: z.string().min(1).max(15),
  counterpart_name: z.string().min(1).max(255),
  is_exempt: z.boolean().default(false),
  taxable_base: z.string().min(1),
  tax_rate: z.string().default('16.00'),
  tax_amount: z.string().default('0.00'),
  igtf_amount: z.string().default('0.00'),
  withholding_amount: z.string().default('0.00'),
  total_amount: z.string().min(1),
  currency: z.string().max(10).default('USD'),
  exchange_rate: z.string().optional().nullable(),
  payment_method_code: z.string().max(50).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
})

export const updateEntrySchema = createEntrySchema.partial()

export const listEntriesSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  search: z.string().optional(),
  book_type: z.enum(['sales', 'purchases']).optional(),
  period_month: z.string().optional(),
  document_type: z.string().optional(),
}).passthrough()

export type CreateEntryInput = z.infer<typeof createEntrySchema>
export type UpdateEntryInput = z.infer<typeof updateEntrySchema>
