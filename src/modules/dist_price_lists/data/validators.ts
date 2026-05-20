import { z } from 'zod'

export const createPriceListSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(50),
  type: z.enum(['standard', 'promotional', 'volume']).default('standard'),
  currency: z.string().max(10).default('USD'),
  is_default: z.boolean().default(false),
  valid_from: z.string().optional().nullable(),
  valid_until: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
  description: z.string().max(2000).optional().nullable(),
})

export const updatePriceListSchema = createPriceListSchema.partial()

export const createPriceListItemSchema = z.object({
  price_list_id: z.string().uuid(),
  product_id: z.string().uuid(),
  variant_id: z.string().uuid().optional().nullable(),
  unit_price: z.string().min(1),
  min_quantity: z.coerce.number().min(1).default(1),
  currency: z.string().max(10).default('USD'),
})

export const updatePriceListItemSchema = createPriceListItemSchema.partial()

export const assignCustomerSchema = z.object({
  customer_id: z.string().uuid(),
  price_list_id: z.string().uuid(),
  priority: z.coerce.number().min(0).default(0),
})

export const listPriceListsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  search: z.string().optional(),
  type: z.string().optional(),
  is_active: z.string().optional(),
}).passthrough()

export type CreatePriceListInput = z.infer<typeof createPriceListSchema>
export type CreatePriceListItemInput = z.infer<typeof createPriceListItemSchema>
