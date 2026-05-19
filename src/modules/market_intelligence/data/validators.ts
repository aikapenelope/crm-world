import { z } from 'zod'

export const valuationRequestSchema = z.object({
  property_type: z.string().min(1),
  operation: z.string().min(1),
  city: z.string().min(1).max(100),
  zone: z.string().max(200).nullable().optional(),
  area_m2: z.coerce.number().min(1).optional(),
  bedrooms: z.coerce.number().int().min(0).optional(),
  reference_price: z.coerce.number().min(0).optional(),
  property_id: z.string().uuid().nullable().optional(),
})

export const comparablesRequestSchema = z.object({
  property_type: z.string().min(1),
  operation: z.string().min(1),
  city: z.string().min(1).max(100),
  price: z.coerce.number().min(0).optional(),
  area_m2: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(20).default(10),
})

export type ValuationRequest = z.infer<typeof valuationRequestSchema>
export type ComparablesRequest = z.infer<typeof comparablesRequestSchema>
