import { z } from 'zod'

export const createEntrySchema = z.object({
  building_id: z.string().uuid(),
  entry_type: z.enum(['income', 'expense']),
  category: z.enum(['condo_fee', 'extraordinary', 'reserve_fund', 'maintenance', 'utilities', 'payroll', 'insurance', 'legal', 'other']),
  description: z.string().min(1).max(255),
  amount: z.string(),
  currency: z.string().max(10).default('USD'),
  exchange_rate: z.string().optional().nullable(),
  reference_type: z.string().max(20).optional().nullable(),
  reference_id: z.string().uuid().optional().nullable(),
  entry_date: z.string(),
  period_month: z.string().regex(/^\d{4}-\d{2}$/),
  supplier_name: z.string().max(255).optional().nullable(),
  document_number: z.string().max(100).optional().nullable(),
  is_reserve_fund: z.boolean().default(false),
  notes: z.string().max(1000).optional().nullable(),
})

export const updateEntrySchema = createEntrySchema.partial()

export const createBudgetSchema = z.object({
  building_id: z.string().uuid(),
  year: z.coerce.number().min(2020).max(2100),
  status: z.enum(['draft', 'approved', 'active', 'closed']).default('draft'),
  total_income: z.string(),
  total_expenses: z.string(),
  reserve_fund_percent: z.string().default('10.00'),
  currency: z.string().max(10).default('USD'),
  approved_in_assembly: z.boolean().default(false),
  assembly_date: z.string().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
})

export const updateBudgetSchema = createBudgetSchema.partial()

export type CreateEntryInput = z.infer<typeof createEntrySchema>
export type CreateBudgetInput = z.infer<typeof createBudgetSchema>
