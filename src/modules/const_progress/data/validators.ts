import { z } from 'zod'

export const createValuationSchema = z.object({
  project_id: z.string().uuid(),
  period_from: z.string(),
  period_to: z.string(),
  status: z.enum(['draft', 'submitted', 'approved', 'invoiced', 'paid', 'rejected']).default('draft'),
  total_contract: z.string(),
  previous_billed: z.string().default('0.00'),
  current_period: z.string().default('0.00'),
  retention_amount: z.string().default('0.00'),
  advance_deduction: z.string().default('0.00'),
  net_payable: z.string().default('0.00'),
  exchange_rate: z.string().optional().nullable(),
  amount_ves: z.string().optional().nullable(),
  currency: z.string().max(10).default('USD'),
  invoice_number: z.string().max(100).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
})

export const updateValuationSchema = createValuationSchema.partial()

export const createValuationLineSchema = z.object({
  valuation_id: z.string().uuid(),
  budget_item_id: z.string().uuid(),
  item_number: z.string().min(1).max(30),
  item_name: z.string().min(1).max(500),
  unit: z.string().max(20).optional().nullable(),
  contracted_quantity: z.string(),
  unit_price: z.string(),
  previous_quantity: z.string().default('0.0000'),
  current_quantity: z.string().default('0.0000'),
  current_amount: z.string().default('0.00'),
  accumulated_percent: z.string().default('0.00'),
})

export const updateValuationLineSchema = createValuationLineSchema.partial()

export type CreateValuationInput = z.infer<typeof createValuationSchema>
