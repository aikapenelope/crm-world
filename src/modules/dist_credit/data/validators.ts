import { z } from 'zod'

export const createCreditLimitSchema = z.object({
  customer_id: z.string().uuid(),
  credit_limit: z.string().min(1),
  currency: z.string().max(10).default('USD'),
  payment_terms_days: z.coerce.number().min(1).max(365).default(30),
  status: z.enum(['active', 'suspended', 'blocked']).default('active'),
  notes: z.string().max(2000).optional().nullable(),
})

export const updateCreditLimitSchema = createCreditLimitSchema.partial()

export const createCreditTransactionSchema = z.object({
  customer_id: z.string().uuid(),
  type: z.enum(['invoice', 'payment', 'credit_note', 'adjustment']),
  reference_type: z.enum(['sales_invoice', 'sales_payment', 'sales_credit_memo', 'manual']),
  reference_id: z.string().uuid().optional().nullable(),
  amount: z.string().min(1),
  currency: z.string().max(10).default('USD'),
  exchange_rate: z.string().optional().nullable(),
  due_date: z.string().optional().nullable(),
  description: z.string().min(1).max(255),
})

export const listCreditLimitsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  search: z.string().optional(),
  status: z.string().optional(),
}).passthrough()

export const listTransactionsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  customer_id: z.string().uuid().optional(),
  type: z.string().optional(),
}).passthrough()

export type CreateCreditLimitInput = z.infer<typeof createCreditLimitSchema>
export type CreateCreditTransactionInput = z.infer<typeof createCreditTransactionSchema>
