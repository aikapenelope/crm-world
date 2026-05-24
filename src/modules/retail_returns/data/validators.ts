import { z } from 'zod'

export const createReturnSchema = z.object({
  branch_id: z.string().uuid(),
  customer_id: z.string().uuid().nullable().optional(),
  original_order_id: z.string().uuid().nullable().optional(),
  reason: z.enum(['defective', 'wrong_item', 'not_as_described', 'changed_mind', 'damaged_shipping', 'other']),
  reason_detail: z.string().max(500).nullable().optional(),
  refund_method: z.enum(['original', 'credit_note', 'store_credit', 'cash']).default('credit_note'),
  notes: z.string().max(500).nullable().optional(),
  lines: z.array(z.object({
    product_id: z.string().uuid(),
    variant_id: z.string().uuid().nullable().optional(),
    quantity: z.number().int().min(1),
    unit_price: z.string(),
    condition: z.enum(['new', 'good', 'damaged', 'defective', 'unsellable']).default('good'),
    restock: z.boolean().default(true),
    notes: z.string().max(200).nullable().optional(),
  })).min(1),
})

export const updateReturnSchema = z.object({
  status: z.enum(['approved', 'inspecting', 'completed', 'rejected', 'cancelled']).optional(),
  processed_by: z.string().uuid().optional(),
  notes: z.string().max(500).nullable().optional(),
})

export const listReturnSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  status: z.enum(['requested', 'approved', 'inspecting', 'completed', 'rejected', 'cancelled']).optional(),
  branch_id: z.string().uuid().optional(),
}).passthrough()

export const createPolicySchema = z.object({
  name: z.string().min(1).max(100),
  category_ids: z.array(z.string().uuid()).nullable().optional(),
  max_days: z.number().int().min(1).default(30),
  requires_receipt: z.boolean().default(true),
  requires_original_packaging: z.boolean().default(false),
  refund_method: z.enum(['original', 'credit_note', 'store_credit', 'cash']).default('credit_note'),
  restocking_fee_percent: z.string().default('0.00'),
  conditions: z.record(z.string(), z.unknown()).nullable().optional(),
})

export const listPolicySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
}).passthrough()

export const listCreditNotesSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  customer_id: z.string().uuid().optional(),
  status: z.enum(['active', 'partially_used', 'fully_used', 'expired', 'cancelled']).optional(),
}).passthrough()
