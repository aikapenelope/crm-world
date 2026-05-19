import { z } from 'zod'
import { TransactionType, TransactionStatus } from './entities'

export const createTransactionSchema = z.object({
  property_id: z.string().uuid(),
  contact_id: z.string().uuid().nullable().optional(),
  transaction_type: z.nativeEnum(TransactionType),
  status: z.nativeEnum(TransactionStatus).default(TransactionStatus.PENDING),
  closing_date: z.string().datetime().nullable().optional(),

  // Financial
  sale_price: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Precio inválido'),
  currency: z.string().min(3).max(10).default('USD'),
  sale_price_ves: z.string().regex(/^\d+(\.\d{1,2})?$/).nullable().optional(),
  exchange_rate: z.string().regex(/^\d+(\.\d{1,8})?$/).nullable().optional(),

  // Commission
  commission_rate: z.string().regex(/^\d+(\.\d{1,2})?$/).default('5.00'),
  commission_amount: z.string().regex(/^\d+(\.\d{1,2})?$/).nullable().optional(),
  commission_currency: z.string().min(3).max(10).nullable().optional(),

  // Payment
  payment_method_code: z.string().max(50).nullable().optional(),
  payment_record_id: z.string().uuid().nullable().optional(),

  // Lease-specific
  monthly_rent: z.string().regex(/^\d+(\.\d{1,2})?$/).nullable().optional(),
  lease_start: z.string().datetime().nullable().optional(),
  lease_end: z.string().datetime().nullable().optional(),
  lease_months: z.number().int().min(1).max(120).nullable().optional(),

  // Agents
  listing_agent_id: z.string().uuid().nullable().optional(),
  buyer_agent_id: z.string().uuid().nullable().optional(),

  // Notes
  notes: z.string().max(5000).nullable().optional(),
})

export const updateTransactionSchema = createTransactionSchema.partial()

export const completeTransactionSchema = z.object({
  closing_date: z.string().datetime(),
  sale_price: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  commission_amount: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  payment_method_code: z.string().max(50).optional(),
  notes: z.string().max(5000).nullable().optional(),
})

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>
export type CompleteTransactionInput = z.infer<typeof completeTransactionSchema>
