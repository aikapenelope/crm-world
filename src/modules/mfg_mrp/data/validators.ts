import { z } from 'zod'

export const productionPlanCreateSchema = z.object({
  plan_number:  z.string().min(1).max(50),
  period_start: z.coerce.date(),
  period_end:   z.coerce.date(),
  status:       z.enum(['draft', 'running', 'completed', 'active']).default('draft'),
  notes:        z.string().optional().nullable(),
})
export const productionPlanUpdateSchema = productionPlanCreateSchema.partial()

export const mrpRequirementUpdateSchema = z.object({
  status: z.enum(['pending', 'requisition_created', 'covered']).optional(),
  supplier_id: z.string().uuid().optional().nullable(),
  supplier_name: z.string().max(255).optional().nullable(),
})

export const purchaseRequisitionCreateSchema = z.object({
  requisition_number:   z.string().min(1).max(50),
  mrp_requirement_id:   z.string().uuid().optional().nullable(),
  material_id:          z.string().uuid(),
  material_code:        z.string().min(1).max(100),
  material_name:        z.string().min(1).max(255),
  quantity:             z.string(),
  uom:                  z.string().max(20),
  required_by_date:     z.coerce.date(),
  suggested_po_date:    z.coerce.date(),
  unit_cost_usd:        z.string().optional().nullable(),
  total_cost_usd:       z.string().optional().nullable(),
  is_imported:          z.boolean().default(false),
  supplier_id:          z.string().uuid().optional().nullable(),
  supplier_name:        z.string().max(255).optional().nullable(),
  status:               z.enum(['pending', 'approved', 'po_created', 'cancelled']).default('pending'),
  customs_days_estimate: z.number().int().nonnegative().optional().nullable(),
  notes:                z.string().optional().nullable(),
})
export const purchaseRequisitionUpdateSchema = purchaseRequisitionCreateSchema.partial()
