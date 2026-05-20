import { z } from 'zod'

export const listDebtorsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  building_id: z.string().uuid().optional(),
  status: z.string().optional(),
  min_months: z.coerce.number().optional(),
}).passthrough()

export const createAgreementSchema = z.object({
  unit_id: z.string().uuid(),
  debtor_id: z.string().uuid().optional().nullable(),
  total_debt: z.string(),
  installments: z.coerce.number().min(2).max(36),
  installment_amount: z.string(),
  currency: z.string().max(10).default('USD'),
  start_date: z.string(),
  notes: z.string().max(1000).optional().nullable(),
})

export const updateAgreementSchema = z.object({
  status: z.enum(['active', 'completed', 'defaulted', 'cancelled']).optional(),
  paid_installments: z.coerce.number().optional(),
  next_due_date: z.string().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
}).passthrough()

export const createActionSchema = z.object({
  unit_id: z.string().uuid(),
  action_type: z.enum(['whatsapp', 'call', 'visit', 'letter', 'legal_notice', 'assembly_report']),
  action_date: z.string(),
  result: z.enum(['contacted', 'no_answer', 'promised_payment', 'refused', 'agreement_reached']),
  notes: z.string().max(1000).optional().nullable(),
  next_action_date: z.string().optional().nullable(),
})

export type CreateAgreementInput = z.infer<typeof createAgreementSchema>
export type CreateActionInput = z.infer<typeof createActionSchema>
