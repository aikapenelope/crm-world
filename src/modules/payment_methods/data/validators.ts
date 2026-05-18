import { z } from 'zod'

export const createPaymentMethodSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  currency: z.string().min(3).max(10),
  requiresReference: z.boolean().default(false),
  referenceLabel: z.string().max(100).nullable().optional(),
  instructions: z.string().max(2000).nullable().optional(),
  icon: z.string().max(50).nullable().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
})

export const updatePaymentMethodSchema = createPaymentMethodSchema.partial()

export const recordPaymentSchema = z.object({
  payment_method_code: z.string().min(1).max(50),
  amount: z.string().regex(/^\d+(\.\d{1,4})?$/, 'Monto inválido'),
  currency: z.string().min(3).max(10),
  amount_usd: z.string().regex(/^\d+(\.\d{1,4})?$/).nullable().optional(),
  exchange_rate: z.string().regex(/^\d+(\.\d{1,8})?$/).nullable().optional(),
  reference: z.string().max(255).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  reference_type: z.string().max(50).nullable().optional(),
  reference_id: z.string().uuid().nullable().optional(),
  payment_date: z.string().datetime(),
})

export const updatePaymentRecordSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'rejected', 'cancelled']).optional(),
  reference: z.string().max(255).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  amount_usd: z.string().regex(/^\d+(\.\d{1,4})?$/).nullable().optional(),
  exchange_rate: z.string().regex(/^\d+(\.\d{1,8})?$/).nullable().optional(),
})

export type CreatePaymentMethodInput = z.infer<typeof createPaymentMethodSchema>
export type UpdatePaymentMethodInput = z.infer<typeof updatePaymentMethodSchema>
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>
export type UpdatePaymentRecordInput = z.infer<typeof updatePaymentRecordSchema>
