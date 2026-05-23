import { z } from 'zod'

export const recallCreateSchema = z.object({
  recall_number:    z.string().min(1).max(50),
  processing_lot_id: z.string().uuid(),
  lot_number:       z.string().min(1).max(50),
  reason:           z.string().min(1),
  recall_class:     z.enum(['I', 'II', 'III']).default('II'),
  detection_source: z.enum(['customer_complaint', 'insai_alert', 'internal_analysis', 'supplier_notification', 'regulatory_audit']),
  initiated_date:   z.coerce.date(),
  status:           z.enum(['investigating', 'executing', 'completed', 'closed']).default('investigating'),
  affected_clients: z.array(z.object({
    client_id:   z.string().uuid().optional(),
    client_name: z.string(),
    quantity_kg: z.number().optional(),
    notified_at: z.string().nullable().optional(),
  })).default([]),
  quantity_recalled_kg: z.string().optional().nullable(),
  public_announcement: z.boolean().default(false),
  corrective_action:   z.string().optional().nullable(),
  notes:               z.string().optional().nullable(),
})
export const recallUpdateSchema = recallCreateSchema.partial()
