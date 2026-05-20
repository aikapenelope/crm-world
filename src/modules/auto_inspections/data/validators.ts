import { z } from 'zod'

export const createInspectionSchema = z.object({
  service_order_id: z.string().uuid(),
  vehicle_id: z.string().uuid(),
  type: z.enum(['intake', 'diagnosis', 'progress', 'completion']).default('intake'),
  inspector_id: z.string().uuid().optional().nullable(),
  overall_condition: z.enum(['good', 'fair', 'needs_attention', 'critical']).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
})

export const updateInspectionSchema = z.object({
  status: z.enum(['in_progress', 'completed', 'sent_to_customer']).optional(),
  overall_condition: z.enum(['good', 'fair', 'needs_attention', 'critical']).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
})

export const createInspectionItemSchema = z.object({
  inspection_id: z.string().uuid(),
  system_category: z.enum(['brakes', 'engine', 'suspension', 'electrical', 'tires', 'fluids', 'body', 'interior', 'exhaust', 'transmission', 'cooling', 'steering', 'other']),
  item_name: z.string().min(1).max(255),
  condition: z.enum(['good', 'fair', 'needs_attention', 'critical', 'not_inspected']).default('not_inspected'),
  notes: z.string().max(1000).optional().nullable(),
  recommended_action: z.string().max(500).optional().nullable(),
  urgency: z.enum(['none', 'soon', 'immediate']).default('none'),
})

export const createInspectionPhotoSchema = z.object({
  inspection_id: z.string().uuid(),
  inspection_item_id: z.string().uuid().optional().nullable(),
  photo_url: z.string().min(1),
  photo_type: z.enum(['before', 'during', 'after', 'finding']).default('finding'),
  caption: z.string().max(255).optional().nullable(),
  annotations_json: z.any().optional().nullable(),
})

export const listInspectionsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  service_order_id: z.string().uuid().optional(),
  vehicle_id: z.string().uuid().optional(),
  type: z.string().optional(),
}).passthrough()

export type CreateInspectionInput = z.infer<typeof createInspectionSchema>
export type CreateInspectionItemInput = z.infer<typeof createInspectionItemSchema>
export type CreateInspectionPhotoInput = z.infer<typeof createInspectionPhotoSchema>
