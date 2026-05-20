import { z } from 'zod'

export const createVehicleSchema = z.object({
  customer_id: z.string().uuid(),
  plate: z.string().min(1).max(15),
  brand: z.string().min(1).max(50),
  model: z.string().min(1).max(50),
  year: z.coerce.number().min(1950).max(2030),
  color: z.string().max(30).optional().nullable(),
  vin: z.string().max(20).optional().nullable(),
  engine_type: z.enum(['gasoline', 'diesel', 'hybrid', 'electric', 'gas']).default('gasoline'),
  transmission: z.enum(['manual', 'automatic']).default('manual'),
  current_km: z.coerce.number().min(0).default(0),
  notes: z.string().max(2000).optional().nullable(),
})

export const updateVehicleSchema = createVehicleSchema.partial()

export const createPhotoSchema = z.object({
  vehicle_id: z.string().uuid(),
  photo_url: z.string().min(1),
  photo_type: z.enum(['front', 'rear', 'left', 'right', 'interior', 'engine', 'damage', 'other']).default('other'),
  caption: z.string().max(255).optional().nullable(),
})

export const listVehiclesSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  search: z.string().optional(),
  customer_id: z.string().uuid().optional(),
}).passthrough()

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>
export type CreatePhotoInput = z.infer<typeof createPhotoSchema>
