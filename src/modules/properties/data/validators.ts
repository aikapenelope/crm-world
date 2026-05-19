import { z } from 'zod'
import { PropertyType, PropertyOperation, PropertyStatus } from './entities'

// ---------------------------------------------------------------------------
// Property validators
// ---------------------------------------------------------------------------

export const createPropertySchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(5000).nullable().optional(),
  property_type: z.nativeEnum(PropertyType),
  operation: z.nativeEnum(PropertyOperation),
  status: z.nativeEnum(PropertyStatus).default(PropertyStatus.DRAFT),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Precio inválido'),
  currency: z.string().min(3).max(10).default('USD'),
  area_m2: z.string().regex(/^\d+(\.\d{1,2})?$/).nullable().optional(),
  bedrooms: z.number().int().min(0).max(50).nullable().optional(),
  bathrooms: z.number().int().min(0).max(30).nullable().optional(),
  parking: z.number().int().min(0).max(20).nullable().optional(),
  address_line: z.string().max(500).nullable().optional(),
  city: z.string().min(1).max(100),
  state: z.string().max(100).nullable().optional(),
  zip: z.string().max(20).nullable().optional(),
  country: z.string().length(2).default('VE'),
  latitude: z.string().regex(/^-?\d+(\.\d{1,7})?$/).nullable().optional(),
  longitude: z.string().regex(/^-?\d+(\.\d{1,7})?$/).nullable().optional(),
  commission_rate: z.string().regex(/^\d+(\.\d{1,2})?$/).default('5.00'),
  contact_id: z.string().uuid().nullable().optional(),
  assigned_to: z.string().uuid().nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
})

export const updatePropertySchema = createPropertySchema.partial()

export const changeStatusSchema = z.object({
  status: z.nativeEnum(PropertyStatus),
})

// ---------------------------------------------------------------------------
// Property Image validators
// ---------------------------------------------------------------------------

export const addPropertyImageSchema = z.object({
  property_id: z.string().uuid(),
  attachment_id: z.string().uuid(),
  sort_order: z.number().int().min(0).max(10).default(0),
  is_cover: z.boolean().default(false),
})

// ---------------------------------------------------------------------------
// Property Link validators
// ---------------------------------------------------------------------------

export const addPropertyLinkSchema = z.object({
  property_id: z.string().uuid(),
  platform: z.enum(['mercadolibre', 'facebook', 'instagram', 'tiktok', 'otro']),
  url: z.string().url().max(500),
  label: z.string().max(100).nullable().optional(),
})

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CreatePropertyInput = z.infer<typeof createPropertySchema>
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>
export type AddPropertyImageInput = z.infer<typeof addPropertyImageSchema>
export type AddPropertyLinkInput = z.infer<typeof addPropertyLinkSchema>
