import { z } from 'zod'

export const createInventoryItemSchema = z.object({
  product_id: z.string().uuid(),
  variant_id: z.string().uuid().optional().nullable(),
  warehouse_code: z.string().max(50).default('main'),
  quantity_available: z.coerce.number().min(0).default(0),
  reorder_point: z.coerce.number().min(0).default(0),
  reorder_quantity: z.coerce.number().min(0).default(0),
  unit_cost: z.string().default('0.0000'),
  currency: z.string().max(10).default('USD'),
})

export const updateInventoryItemSchema = createInventoryItemSchema.partial()

export const createMovementSchema = z.object({
  product_id: z.string().uuid(),
  variant_id: z.string().uuid().optional().nullable(),
  warehouse_code: z.string().max(50).default('main'),
  type: z.enum(['purchase_in', 'sale_out', 'return_in', 'adjustment', 'transfer', 'count']),
  quantity: z.coerce.number(),
  reference_type: z.enum(['sales_order', 'purchase_order', 'return', 'manual']).default('manual'),
  reference_id: z.string().uuid().optional().nullable(),
  unit_cost: z.string().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
})

export const listInventorySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  search: z.string().optional(),
  warehouse_code: z.string().optional(),
  low_stock: z.string().optional(),
}).passthrough()

export const listMovementsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  product_id: z.string().uuid().optional(),
  type: z.string().optional(),
}).passthrough()

export type CreateInventoryItemInput = z.infer<typeof createInventoryItemSchema>
export type CreateMovementInput = z.infer<typeof createMovementSchema>
