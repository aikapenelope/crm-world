import { z } from 'zod'

// =============================================================================
// Building validators
// =============================================================================

export const createBuildingSchema = z.object({
  name: z.string().min(1).max(255),
  code: z.string().min(1).max(50),
  building_type: z.enum(['residential', 'commercial', 'mixed']),
  address: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  total_units: z.coerce.number().min(0).default(0),
  total_floors: z.coerce.number().min(0).optional().nullable(),
  year_built: z.coerce.number().min(1900).max(2100).optional().nullable(),
  rif: z.string().max(20).optional().nullable(),
  admin_company: z.string().max(255).optional().nullable(),
  document_number: z.string().max(100).optional().nullable(),
  common_areas: z.array(z.string()).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable()),
  is_active: z.boolean().default(true),
})

export const updateBuildingSchema = createBuildingSchema.partial()

export const listBuildingsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  search: z.string().optional(),
  building_type: z.string().optional(),
  is_active: z.string().optional(),
}).passthrough()

// =============================================================================
// Unit validators
// =============================================================================

export const createUnitSchema = z.object({
  building_id: z.string().uuid(),
  unit_number: z.string().min(1).max(20),
  unit_type: z.enum(['apartment', 'penthouse', 'local', 'office', 'parking', 'storage']),
  floor: z.string().max(10).optional().nullable(),
  area_m2: z.string().optional().nullable(),
  aliquot_percent: z.string().default('0.00000'),
  bedrooms: z.coerce.number().min(0).optional().nullable(),
  bathrooms: z.coerce.number().min(0).optional().nullable(),
  parking_spots: z.coerce.number().min(0).default(0),
  storage_units: z.coerce.number().min(0).default(0),
  status: z.enum(['occupied', 'vacant', 'for_sale', 'for_rent']),
  owner_id: z.string().uuid().optional().nullable(),
  resident_id: z.string().uuid().optional().nullable(),
  owner_name: z.string().max(255).optional().nullable(),
  owner_phone: z.string().max(50).optional().nullable(),
  owner_email: z.string().max(255).optional().nullable(),
  resident_name: z.string().max(255).optional().nullable(),
  resident_phone: z.string().max(50).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
})

export const updateUnitSchema = createUnitSchema.partial()

export const listUnitsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  search: z.string().optional(),
  building_id: z.string().uuid().optional(),
  unit_type: z.string().optional(),
  status: z.string().optional(),
}).passthrough()

// =============================================================================
// Common Area validators
// =============================================================================

export const createCommonAreaSchema = z.object({
  building_id: z.string().uuid(),
  name: z.string().min(1).max(255),
  area_type: z.enum(['social', 'sports', 'parking', 'garden', 'other']),
  capacity: z.coerce.number().min(0).optional().nullable(),
  is_reservable: z.boolean().default(false),
  reservation_fee: z.string().optional().nullable(),
  rules: z.string().max(2000).optional().nullable(),
  is_active: z.boolean().default(true),
})

export const updateCommonAreaSchema = createCommonAreaSchema.partial()

export const listCommonAreasSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  building_id: z.string().uuid().optional(),
}).passthrough()

export type CreateBuildingInput = z.infer<typeof createBuildingSchema>
export type CreateUnitInput = z.infer<typeof createUnitSchema>
export type CreateCommonAreaInput = z.infer<typeof createCommonAreaSchema>
