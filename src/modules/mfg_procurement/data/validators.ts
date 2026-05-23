import { z } from 'zod'

export const supplierCreateSchema = z.object({
  supplier_code:   z.string().min(1).max(30),
  name:            z.string().min(1).max(255),
  country:         z.string().max(100).optional().nullable(),
  supplier_type:   z.enum(['national', 'international']).default('national'),
  contact_name:    z.string().max(255).optional().nullable(),
  contact_email:   z.string().email().optional().nullable(),
  contact_phone:   z.string().max(50).optional().nullable(),
  payment_terms:   z.enum(['advance', 'letter_of_credit', 'net_30', 'net_60', 'open_account']).default('advance'),
  currency:        z.string().max(10).default('USD'),
  is_active:       z.boolean().default(true),
  notes:           z.string().optional().nullable(),
})
export const supplierUpdateSchema = supplierCreateSchema.partial()

export const purchaseOrderCreateSchema = z.object({
  po_number:       z.string().min(1).max(50),
  supplier_id:     z.string().uuid(),
  supplier_name:   z.string().min(1).max(255),
  po_type:         z.enum(['national', 'international']).default('national'),
  status:          z.enum(['draft', 'sent', 'confirmed', 'in_transit', 'at_customs', 'delivered', 'cancelled']).default('draft'),
  currency:        z.string().max(10).default('USD'),
  subtotal_fob:    z.string().default('0.00'),
  freight_cost:    z.string().default('0.00'),
  insurance_cost:  z.string().default('0.00'),
  tariff_cost:     z.string().default('0.00'),
  import_vat:      z.string().default('0.00'),
  agency_fees:     z.string().default('0.00'),
  inland_transport: z.string().default('0.00'),
  total_cif_cost:  z.string().default('0.00'),
  incoterm:        z.string().max(10).optional().nullable(),
  country_of_origin: z.string().max(100).optional().nullable(),
  dau_number:      z.string().max(50).optional().nullable(),
  customs_agent:   z.string().max(255).optional().nullable(),
  estimated_ship_date: z.coerce.date().optional().nullable(),
  estimated_arrival_port: z.coerce.date().optional().nullable(),
  estimated_customs_clearance: z.coerce.date().optional().nullable(),
  estimated_warehouse_arrival: z.coerce.date().optional().nullable(),
  bcv_rate_at_order: z.string().optional().nullable(),
  notes:           z.string().optional().nullable(),
})
export const purchaseOrderUpdateSchema = purchaseOrderCreateSchema.partial()

export const poLineCreateSchema = z.object({
  po_id:         z.string().uuid(),
  line_number:   z.number().int().positive(),
  material_id:   z.string().uuid(),
  material_code: z.string().min(1).max(100),
  material_name: z.string().min(1).max(255),
  quantity:      z.string(),
  uom:           z.string().max(20),
  unit_price:    z.string(),
  total_price:   z.string(),
  requisition_id: z.string().uuid().optional().nullable(),
})
export const poLineUpdateSchema = poLineCreateSchema.partial()
