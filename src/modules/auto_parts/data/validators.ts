import { z } from 'zod'

export const createPartSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(255),
  brand: z.string().max(100).optional().nullable(),
  category: z.enum(['brakes', 'engine', 'electrical', 'suspension', 'filters', 'fluids', 'body', 'other']).default('other'),
  compatible_brands: z.array(z.string()).optional().nullable(),
  unit: z.string().max(20).default('pieza'),
  cost_price: z.string().min(1),
  sell_price: z.string().min(1),
  currency: z.string().max(10).default('USD'),
  quantity_in_stock: z.coerce.number().min(0).default(0),
  reorder_point: z.coerce.number().min(0).default(0),
  location: z.string().max(50).optional().nullable(),
})

export const updatePartSchema = createPartSchema.partial()

export const listPartsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  search: z.string().optional(),
  category: z.string().optional(),
}).passthrough()

export type CreatePartInput = z.infer<typeof createPartSchema>
