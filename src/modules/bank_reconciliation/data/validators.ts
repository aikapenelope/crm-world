import { z } from 'zod'

export const uploadStatementSchema = z.object({
  bank_code: z.string().min(1).max(50),
  bank_name: z.string().min(1).max(100),
  account_number: z.string().max(50).optional().nullable(),
  period_month: z.string().regex(/^\d{4}-\d{2}$/, 'Formato: YYYY-MM'),
  filename: z.string().min(1).max(255),
  transactions: z.array(z.object({
    transaction_date: z.string().min(1),
    description: z.string().max(255).optional().nullable(),
    reference: z.string().max(100).optional().nullable(),
    direction: z.enum(['credit', 'debit']),
    amount: z.string().min(1),
    currency: z.string().max(10).default('VES'),
    balance: z.string().optional().nullable(),
  })),
})

export const reconcileTransactionSchema = z.object({
  reconciliation_status: z.enum(['matched', 'unmatched', 'ignored']),
  matched_payment_id: z.string().uuid().optional().nullable(),
  match_notes: z.string().max(500).optional().nullable(),
})

export const listTransactionsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  statement_id: z.string().uuid().optional(),
  reconciliation_status: z.string().optional(),
  search: z.string().optional(),
}).passthrough()

export type UploadStatementInput = z.infer<typeof uploadStatementSchema>
export type ReconcileTransactionInput = z.infer<typeof reconcileTransactionSchema>
