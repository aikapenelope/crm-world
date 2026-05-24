import { z } from 'zod'

// =============================================================================
// Branch validators
// =============================================================================

export const createBranchSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(20),
  branch_type: z.enum(['store', 'warehouse', 'kiosk', 'popup']).default('store'),
  sales_channel_id: z.string().uuid().nullable().optional(),
  address_line1: z.string().max(200).nullable().optional(),
  address_line2: z.string().max(200).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  state: z.string().max(100).nullable().optional(),
  postal_code: z.string().max(20).nullable().optional(),
  latitude: z.string().nullable().optional(),
  longitude: z.string().nullable().optional(),
  phone: z.string().max(30).nullable().optional(),
  email: z.string().email().nullable().optional(),
  manager_user_id: z.string().uuid().nullable().optional(),
  is_active: z.boolean().default(true),
  operating_hours: z.record(z.string(), z.object({ open: z.string(), close: z.string() })).nullable().optional()),
  metadata: z.record(z.string(), z.unknown()).nullable().optional()),
})

export const updateBranchSchema = createBranchSchema.partial()

export const listBranchSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  search: z.string().optional(),
  branch_type: z.enum(['store', 'warehouse', 'kiosk', 'popup']).optional(),
  is_active: z.coerce.boolean().optional(),
}).passthrough()

// =============================================================================
// Staff validators
// =============================================================================

export const createStaffSchema = z.object({
  branch_id: z.string().uuid(),
  user_id: z.string().uuid(),
  role: z.enum(['manager', 'cashier', 'stock_clerk', 'sales_rep']),
  is_primary: z.boolean().default(false),
})

export const listStaffSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  branch_id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
}).passthrough()

// =============================================================================
// Transfer validators
// =============================================================================

export const createTransferSchema = z.object({
  from_branch_id: z.string().uuid(),
  to_branch_id: z.string().uuid(),
  notes: z.string().max(500).nullable().optional(),
  lines: z.array(z.object({
    product_id: z.string().uuid(),
    variant_id: z.string().uuid().nullable().optional(),
    quantity_requested: z.number().int().min(1),
    notes: z.string().max(200).nullable().optional(),
  })).min(1),
})

export const updateTransferSchema = z.object({
  status: z.enum(['pending_approval', 'approved', 'in_transit', 'received', 'cancelled']).optional(),
  approved_by: z.string().uuid().optional(),
  notes: z.string().max(500).nullable().optional(),
  lines: z.array(z.object({
    id: z.string().uuid(),
    quantity_shipped: z.number().int().min(0).optional(),
    quantity_received: z.number().int().min(0).optional(),
  })).optional(),
})

export const listTransferSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  status: z.enum(['draft', 'pending_approval', 'approved', 'in_transit', 'received', 'cancelled']).optional(),
  from_branch_id: z.string().uuid().optional(),
  to_branch_id: z.string().uuid().optional(),
}).passthrough()
