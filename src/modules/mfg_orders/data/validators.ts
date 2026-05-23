import { z } from 'zod'

export const workCenterCreateSchema = z.object({
  code:                   z.string().min(1).max(30),
  name:                   z.string().min(1).max(255),
  type:                   z.enum(['machine', 'line', 'cell', 'manual']).default('line'),
  capacity_hrs_per_shift: z.string().default('8.00'),
  efficiency_pct:         z.string().default('100.00'),
  cost_per_hr_usd:        z.string().optional().nullable(),
  is_active:              z.boolean().default(true),
  notes:                  z.string().optional().nullable(),
})
export const workCenterUpdateSchema = workCenterCreateSchema.partial()

export const productionOrderCreateSchema = z.object({
  order_number:       z.string().min(1).max(50),
  bom_id:             z.string().uuid(),
  product_id:         z.string().uuid(),
  product_code:       z.string().min(1).max(100),
  product_name:       z.string().min(1).max(255),
  planned_quantity:   z.string(),
  uom:                z.string().max(20),
  work_center_id:     z.string().uuid().optional().nullable(),
  work_center_name:   z.string().max(255).optional().nullable(),
  scheduled_start:    z.coerce.date().optional().nullable(),
  scheduled_end:      z.coerce.date().optional().nullable(),
  status:             z.enum(['planned', 'released', 'in_progress', 'completed', 'cancelled']).default('planned'),
  planned_cost_usd:   z.string().optional().nullable(),
  notes:              z.string().optional().nullable(),
})
export const productionOrderUpdateSchema = productionOrderCreateSchema.partial()

export const orderOperationCreateSchema = z.object({
  order_id:             z.string().uuid(),
  operation_number:     z.number().int().positive(),
  operation_name:       z.string().min(1).max(255),
  work_center_id:       z.string().uuid().optional().nullable(),
  work_center_name:     z.string().max(255).optional().nullable(),
  planned_duration_hrs: z.string(),
  planned_start:        z.coerce.date().optional().nullable(),
  status:               z.enum(['pending', 'in_progress', 'completed', 'skipped']).default('pending'),
  notes:                z.string().optional().nullable(),
})
export const orderOperationUpdateSchema = orderOperationCreateSchema.partial()

export const materialIssueCreateSchema = z.object({
  order_id:         z.string().uuid(),
  bom_line_id:      z.string().uuid().optional().nullable(),
  component_code:   z.string().min(1).max(100),
  component_name:   z.string().min(1).max(255),
  planned_quantity: z.string(),
  issued_quantity:  z.string(),
  uom:              z.string().max(20),
  lot_id:           z.string().uuid().optional().nullable(),
  lot_number:       z.string().max(50).optional().nullable(),
  issue_date:       z.coerce.date(),
  notes:            z.string().optional().nullable(),
})

export const downtimeCreateSchema = z.object({
  order_id:          z.string().uuid().optional().nullable(),
  operation_id:      z.string().uuid().optional().nullable(),
  work_center_id:    z.string().uuid().optional().nullable(),
  work_center_name:  z.string().max(255).optional().nullable(),
  started_at:        z.coerce.date(),
  ended_at:          z.coerce.date().optional().nullable(),
  cause_category:    z.enum(['electrical_cut', 'mechanical_failure', 'material_shortage', 'quality_hold', 'format_change', 'maintenance', 'operator_absence', 'other']),
  cause_description: z.string().min(1),
  impact_description: z.string().optional().nullable(),
  is_force_majeure:  z.boolean().default(false),
  notes:             z.string().optional().nullable(),
})
export const downtimeUpdateSchema = downtimeCreateSchema.partial()
