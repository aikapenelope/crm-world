import { z } from 'zod'
import { PropertyType, PropertyOperation } from '../../properties/data/entities'

export const createPreferenceSchema = z.object({
  contact_id: z.string().uuid(),
  preferred_type: z.nativeEnum(PropertyType).nullable().optional(),
  preferred_operation: z.nativeEnum(PropertyOperation).nullable().optional(),
  preferred_city: z.string().max(100).nullable().optional(),
  max_budget: z.string().regex(/^\d+(\.\d{1,2})?$/).nullable().optional(),
  budget_currency: z.string().min(3).max(10).default('USD'),
  min_area_m2: z.string().regex(/^\d+(\.\d{1,2})?$/).nullable().optional(),
  min_bedrooms: z.number().int().min(0).max(50).nullable().optional(),
  min_bathrooms: z.number().int().min(0).max(30).nullable().optional(),
  min_parking: z.number().int().min(0).max(20).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  is_active: z.boolean().default(true),
})

export const updatePreferenceSchema = createPreferenceSchema.partial().omit({ contact_id: true })

export type CreatePreferenceInput = z.infer<typeof createPreferenceSchema>
export type UpdatePreferenceInput = z.infer<typeof updatePreferenceSchema>
