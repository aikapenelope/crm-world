import { z } from 'zod'

export const qualityPlanCreateSchema = z.object({
  product_id:               z.string().uuid(),
  product_code:             z.string().min(1).max(100),
  product_name:             z.string().min(1).max(255),
  control_point:            z.enum(['receiving', 'in_process', 'finished', 'shipping']).default('in_process'),
  parameter_name:           z.string().min(1).max(255),
  parameter_unit:           z.string().min(1).max(30),
  instrument:               z.string().max(100).optional().nullable(),
  lsl:                      z.string().optional().nullable(),
  usl:                      z.string().optional().nullable(),
  lcl:                      z.string().optional().nullable(),
  ucl:                      z.string().optional().nullable(),
  target:                   z.string().optional().nullable(),
  sampling_frequency:       z.string().max(50).default('per_batch'),
  sample_size:              z.number().int().min(1).max(50).default(5),
  is_critical_control_point: z.boolean().default(false),
  is_active:                z.boolean().default(true),
  notes:                    z.string().optional().nullable(),
})
export const qualityPlanUpdateSchema = qualityPlanCreateSchema.partial()

export const inspectionCreateSchema = z.object({
  plan_id:              z.string().uuid(),
  lot_id:               z.string().uuid().optional().nullable(),
  order_id:             z.string().uuid().optional().nullable(),
  sample_number:        z.number().int().min(1).default(1),
  subgroup_id:          z.string().max(50).optional().nullable(),
  measured_value:       z.string(),
  is_in_spec:           z.boolean().default(true),
  is_in_control:        z.boolean().default(true),
  inspector_id:         z.string().uuid().optional().nullable(),
  inspection_timestamp: z.coerce.date().default(() => new Date()),
  notes:                z.string().optional().nullable(),
})

export const nonconformanceCreateSchema = z.object({
  nc_number:         z.string().min(1).max(50),
  source:            z.enum(['receiving', 'in_process', 'finished_goods', 'customer_return', 'audit']),
  lot_id:            z.string().uuid().optional().nullable(),
  lot_number:        z.string().max(50).optional().nullable(),
  order_id:          z.string().uuid().optional().nullable(),
  product_id:        z.string().uuid().optional().nullable(),
  product_code:      z.string().max(100).optional().nullable(),
  inspection_id:     z.string().uuid().optional().nullable(),
  description:       z.string().min(1),
  severity:          z.enum(['critical', 'major', 'minor']).default('major'),
  quantity_affected: z.string().optional().nullable(),
  uom:               z.string().max(20).optional().nullable(),
  status:            z.enum(['open', 'under_review', 'pending_disposition', 'resolved', 'closed']).default('open'),
  root_cause:        z.string().optional().nullable(),
  disposition:       z.enum(['rework', 'scrap', 'use_as_is', 'return_to_supplier', 'downgrade']).optional().nullable(),
  corrective_action: z.string().optional().nullable(),
  preventive_action: z.string().optional().nullable(),
  cost_nc_usd:       z.string().optional().nullable(),
  notes:             z.string().optional().nullable(),
})
export const nonconformanceUpdateSchema = nonconformanceCreateSchema.partial()
