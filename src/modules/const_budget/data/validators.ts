import { z } from 'zod'

export const createBudgetItemSchema = z.object({
  project_id: z.string().uuid(),
  parent_id: z.string().uuid().optional().nullable(),
  item_number: z.string().min(1).max(30),
  level: z.coerce.number().min(0).max(5).default(0),
  name: z.string().min(1).max(500),
  unit: z.string().max(20).optional().nullable(),
  quantity: z.string().default('0.0000'),
  unit_cost: z.string().default('0.0000'),
  total_cost: z.string().default('0.00'),
  currency: z.string().max(10).default('USD'),
  category: z.enum(['civil', 'electrical', 'mechanical', 'architectural', 'special', 'general']).default('civil'),
  sort_order: z.coerce.number().default(0),
  is_chapter: z.boolean().default(false),
  notes: z.string().max(1000).optional().nullable(),
})

export const updateBudgetItemSchema = createBudgetItemSchema.partial()

export const createBudgetResourceSchema = z.object({
  budget_item_id: z.string().uuid(),
  resource_type: z.enum(['material', 'labor', 'equipment', 'subcontract', 'overhead']),
  name: z.string().min(1).max(500),
  unit: z.string().min(1).max(20),
  quantity: z.string(),
  unit_price: z.string(),
  total: z.string(),
  currency: z.string().max(10).default('USD'),
  sort_order: z.coerce.number().default(0),
})

export const updateBudgetResourceSchema = createBudgetResourceSchema.partial()

export const listBudgetItemsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(500).default(200),
  project_id: z.string().uuid().optional(),
  parent_id: z.string().uuid().optional().nullable(),
  category: z.string().optional(),
}).passthrough()

export type CreateBudgetItemInput = z.infer<typeof createBudgetItemSchema>
