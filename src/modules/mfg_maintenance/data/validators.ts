import { z } from 'zod'

export const equipmentCreateSchema = z.object({
  equipment_code:       z.string().min(1).max(30),
  name:                 z.string().min(1).max(255),
  description:          z.string().optional().nullable(),
  brand:                z.string().max(100).optional().nullable(),
  model:                z.string().max(100).optional().nullable(),
  serial_number:        z.string().max(100).optional().nullable(),
  manufacture_year:     z.number().int().min(1900).max(2099).optional().nullable(),
  work_center_id:       z.string().uuid().optional().nullable(),
  work_center_name:     z.string().max(255).optional().nullable(),
  status:               z.enum(['operational', 'under_maintenance', 'breakdown', 'retired']).default('operational'),
  last_overhaul_date:   z.coerce.date().optional().nullable(),
  replacement_cost_usd: z.string().optional().nullable(),
  supplier_contact:     z.string().max(255).optional().nullable(),
  manual_document_url:  z.string().optional().nullable(),
  criticality:          z.enum(['critical', 'high', 'medium', 'low']).default('medium'),
  accumulated_hours:    z.string().default('0.00'),
  notes:                z.string().optional().nullable(),
})
export const equipmentUpdateSchema = equipmentCreateSchema.partial()

export const maintenancePlanCreateSchema = z.object({
  equipment_id:           z.string().uuid(),
  equipment_code:         z.string().min(1).max(30),
  plan_name:              z.string().min(1).max(255),
  trigger_type:           z.enum(['hours', 'days', 'cycles', 'calendar']).default('days'),
  trigger_interval:       z.string(),
  estimated_duration_hrs: z.string().default('2.00'),
  requires_shutdown:      z.boolean().default(false),
  required_spare_parts:   z.array(z.object({ spare_part_id: z.string().uuid(), part_code: z.string(), part_name: z.string(), quantity: z.number() })).optional().nullable(),
  required_technician_skill: z.string().max(100).optional().nullable(),
  status:                 z.enum(['active', 'overdue', 'paused']).default('active'),
  notes:                  z.string().optional().nullable(),
})
export const maintenancePlanUpdateSchema = maintenancePlanCreateSchema.partial()

export const workOrderCreateSchema = z.object({
  wo_number:         z.string().min(1).max(50),
  equipment_id:      z.string().uuid(),
  equipment_code:    z.string().min(1).max(30),
  equipment_name:    z.string().min(1).max(255),
  maintenance_plan_id: z.string().uuid().optional().nullable(),
  work_type:         z.enum(['preventive', 'corrective', 'predictive']).default('preventive'),
  priority:          z.enum(['critical', 'high', 'medium', 'low']).default('medium'),
  status:            z.enum(['open', 'in_progress', 'completed', 'cancelled']).default('open'),
  description:       z.string().min(1),
  fault_description: z.string().optional().nullable(),
  assigned_to:       z.string().uuid().optional().nullable(),
  scheduled_date:    z.coerce.date().optional().nullable(),
  estimated_duration_hrs: z.string().optional().nullable(),
  notes:             z.string().optional().nullable(),
})
export const workOrderUpdateSchema = workOrderCreateSchema.partial()

export const sparePartCreateSchema = z.object({
  part_code:              z.string().min(1).max(50),
  part_name:              z.string().min(1).max(255),
  description:            z.string().optional().nullable(),
  equipment_ids:          z.array(z.string().uuid()).optional().nullable(),
  current_stock:          z.string().default('0.0000'),
  uom:                    z.string().max(20).default('units'),
  unit_cost_usd:          z.string().optional().nullable(),
  reorder_point:          z.string().default('1.0000'),
  safety_stock:           z.string().default('1.0000'),
  max_stock:              z.string().optional().nullable(),
  is_imported:            z.boolean().default(false),
  lead_time_days:         z.number().int().nonnegative().default(15),
  mtbf_days:              z.string().optional().nullable(),
  supplier_id:            z.string().uuid().optional().nullable(),
  supplier_name:          z.string().max(255).optional().nullable(),
  storage_location:       z.string().max(100).optional().nullable(),
  notes:                  z.string().optional().nullable(),
})
export const sparePartUpdateSchema = sparePartCreateSchema.partial()
