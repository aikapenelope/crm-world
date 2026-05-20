import { z } from 'zod'

// =============================================================================
// Plan Validators
// =============================================================================

export const createPlanSchema = z.object({
  period_id: z.string().uuid().optional().nullable(),
  grade_level: z.string().max(30).optional().nullable(),
  name: z.string().min(1).max(100),
  monthly_amount: z.string(),
  currency: z.string().max(10).default('USD'),
  months: z.coerce.number().int().min(1).max(12).default(10),
  due_day: z.coerce.number().int().min(1).max(28).default(5),
  late_fee_percentage: z.string().default('5.00'),
  late_fee_after_days: z.coerce.number().int().min(1).max(30).default(10),
  is_active: z.boolean().default(true),
})

export const updatePlanSchema = createPlanSchema.partial()

// =============================================================================
// Charge Validators
// =============================================================================

export const createChargeSchema = z.object({
  student_id: z.string().uuid(),
  plan_id: z.string().uuid().optional().nullable(),
  period_month: z.string().regex(/^\d{4}-\d{2}$/),
  concept: z.enum(['mensualidad', 'inscripcion', 'material', 'uniforme', 'transporte', 'evento', 'otro']).default('mensualidad'),
  description: z.string().max(255).optional().nullable(),
  amount: z.string(),
  currency: z.string().max(10).default('USD'),
  status: z.enum(['pending', 'partial', 'paid', 'overdue', 'waived', 'credited']).default('pending'),
  due_date: z.string(),
  notes: z.string().optional().nullable(),
})

export const updateChargeSchema = createChargeSchema.partial().omit({ student_id: true })

// =============================================================================
// Payment Validators
// =============================================================================

export const createPaymentSchema = z.object({
  charge_id: z.string().uuid(),
  student_id: z.string().uuid(),
  representative_contact_id: z.string().uuid().optional().nullable(),
  amount: z.string(),
  currency: z.string().max(10),
  exchange_rate: z.string().optional().nullable(),
  payment_method_code: z.string().max(30).optional().nullable(),
  reference: z.string().max(100).optional().nullable(),
  payment_date: z.string(),
  notes: z.string().optional().nullable(),
})

// =============================================================================
// Discount Validators
// =============================================================================

export const createDiscountSchema = z.object({
  student_id: z.string().uuid(),
  discount_type: z.enum(['sibling', 'scholarship', 'employee', 'early_payment', 'other']),
  percentage: z.string().optional().nullable(),
  fixed_amount: z.string().optional().nullable(),
  reason: z.string().min(1).max(255),
  valid_from: z.string().optional().nullable(),
  valid_until: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
})

export const updateDiscountSchema = createDiscountSchema.partial().omit({ student_id: true })
