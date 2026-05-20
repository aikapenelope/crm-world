import { z } from 'zod'

// =============================================================================
// Supplier
// =============================================================================

export const createSupplierSchema = z.object({
  name: z.string().min(1).max(100),
  rif: z.string().max(20).nullable().optional(),
  contact_name: z.string().max(100).nullable().optional(),
  phone: z.string().max(30).nullable().optional(),
  email: z.string().email().nullable().optional(),
  address: z.string().max(300).nullable().optional(),
  default_payment_days: z.number().int().min(0).default(30),
  currency: z.string().max(10).default('USD'),
  category_ids: z.array(z.string().uuid()).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
})

export const updateSupplierSchema = createSupplierSchema.partial()

export const listSuppliersSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  search: z.string().optional(),
  is_active: z.coerce.boolean().optional(),
}).passthrough()

// =============================================================================
// Purchase Order
// =============================================================================

export const createPurchaseOrderSchema = z.object({
  supplier_id: z.string().uuid(),
  currency: z.string().max(10).default('USD'),
  exchange_rate: z.string().nullable().optional(),
  expected_delivery_date: z.string().nullable().optional(),
  branch_id: z.string().uuid().nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
  lines: z.array(z.object({
    product_id: z.string().uuid(),
    variant_id: z.string().uuid().nullable().optional(),
    quantity_ordered: z.number().int().min(1),
    unit_cost: z.string(),
  })).min(1),
})

export const updatePurchaseOrderSchema = z.object({
  status: z.enum(['sent', 'partially_received', 'received', 'cancelled']).optional(),
  notes: z.string().max(500).nullable().optional(),
  lines: z.array(z.object({
    id: z.string().uuid(),
    quantity_received: z.number().int().min(0),
  })).optional(),
})

export const listPurchaseOrdersSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  status: z.enum(['draft', 'sent', 'partially_received', 'received', 'cancelled']).optional(),
  supplier_id: z.string().uuid().optional(),
}).passthrough()

// =============================================================================
// Payables
// =============================================================================

export const listPayablesSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  status: z.enum(['pending', 'partially_paid', 'paid', 'overdue', 'cancelled']).optional(),
  supplier_id: z.string().uuid().optional(),
}).passthrough()

export const registerPaymentSchema = z.object({
  payable_id: z.string().uuid(),
  amount: z.string(),
  payment_method: z.string().max(30).optional(),
  reference: z.string().max(100).nullable().optional(),
})

// =============================================================================
// Debit/Credit Notes
// =============================================================================

export const createSupplierNoteSchema = z.object({
  supplier_id: z.string().uuid(),
  type: z.enum(['debit', 'credit']),
  amount: z.string(),
  reason: z.string().max(500).nullable().optional(),
  purchase_order_id: z.string().uuid().nullable().optional(),
  payable_id: z.string().uuid().nullable().optional(),
})

export const listSupplierNotesSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  supplier_id: z.string().uuid().optional(),
  type: z.enum(['debit', 'credit']).optional(),
}).passthrough()
