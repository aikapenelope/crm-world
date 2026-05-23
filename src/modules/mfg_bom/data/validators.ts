import { z } from 'zod'

// =============================================================================
// BOM Header
// =============================================================================

export const bomHeaderCreateSchema = z.object({
  product_id:          z.string().uuid(),
  product_code:        z.string().min(1).max(100),
  product_name:        z.string().min(1).max(255),
  version:             z.string().max(10).default('1.0'),
  status:              z.enum(['draft', 'active', 'superseded', 'archived']).default('draft'),
  bom_type:            z.enum(['process', 'discrete']).default('discrete'),
  base_quantity:       z.string().default('1.0000'),
  base_uom:            z.string().max(20),
  expected_yield_pct:  z.string().optional().nullable(),
  approved_by:         z.string().max(255).optional().nullable(),
  change_reason:       z.string().optional().nullable(),
  notes:               z.string().optional().nullable(),
})
export const bomHeaderUpdateSchema = bomHeaderCreateSchema.partial()

// =============================================================================
// BOM Line
// =============================================================================

export const bomLineCreateSchema = z.object({
  bom_id:           z.string().uuid(),
  line_number:      z.number().int().min(1),
  component_id:     z.string().uuid(),
  component_code:   z.string().min(1).max(100),
  component_name:   z.string().min(1).max(255),
  component_type:   z.enum(['raw_material', 'packaging', 'subassembly', 'consumable']).default('raw_material'),
  quantity:         z.string(),
  uom:              z.string().max(20),
  scrap_pct:        z.string().default('0.00'),
  is_critical:      z.boolean().default(true),
  is_phantom:       z.boolean().default(false),
  lead_offset_days: z.number().int().nonnegative().default(0),
  notes:            z.string().optional().nullable(),
})
export const bomLineUpdateSchema = bomLineCreateSchema.partial()

// =============================================================================
// BOM Alternative
// =============================================================================

export const bomAlternativeCreateSchema = z.object({
  bom_line_id:          z.string().uuid(),
  alt_material_id:      z.string().uuid(),
  alt_material_code:    z.string().min(1).max(100),
  alt_material_name:    z.string().min(1).max(255),
  conversion_factor:    z.string().default('1.0000'),
  usage_condition:      z.enum(['shortage_only', 'approved_equivalent', 'cost_reduction']).default('shortage_only'),
  quality_impact_notes: z.string().optional().nullable(),
  is_active:            z.boolean().default(true),
})
export const bomAlternativeUpdateSchema = bomAlternativeCreateSchema.partial()

// =============================================================================
// BOM Version
// =============================================================================

export const bomVersionCreateSchema = z.object({
  product_id:       z.string().uuid(),
  product_code:     z.string().min(1).max(100),
  from_version:     z.string().max(10),
  to_version:       z.string().max(10),
  change_type:      z.enum(['component_change', 'quantity_change', 'yield_change', 'new_alternative', 'process_change']),
  change_summary:   z.string().min(1),
  changed_by:       z.string().uuid().optional().nullable(),
  approved_by:      z.string().uuid().optional().nullable(),
  approved_at:      z.coerce.date().optional().nullable(),
})
