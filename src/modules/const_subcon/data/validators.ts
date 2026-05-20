import { z } from 'zod'

export const createSubcontractorSchema = z.object({
  name: z.string().min(1).max(255),
  rif: z.string().max(20).optional().nullable(),
  specialty: z.enum(['excavation', 'concrete', 'steel', 'masonry', 'electrical', 'mechanical', 'plumbing', 'hvac', 'finishing', 'landscaping', 'other']),
  contact_name: z.string().max(255).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  email: z.string().max(255).optional().nullable(),
  rating: z.coerce.number().min(1).max(5).optional().nullable(),
  is_active: z.boolean().default(true),
  notes: z.string().max(1000).optional().nullable(),
})

export const updateSubcontractorSchema = createSubcontractorSchema.partial()

export const createSubcontractSchema = z.object({
  project_id: z.string().uuid(),
  subcontractor_id: z.string().uuid(),
  subcontractor_name: z.string().min(1).max(255),
  contract_number: z.string().min(1).max(100),
  scope_description: z.string().min(1),
  contract_amount: z.string(),
  retention_percent: z.string().default('10.00'),
  currency: z.string().max(10).default('USD'),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  status: z.enum(['draft', 'active', 'completed', 'terminated']).default('draft'),
  notes: z.string().max(2000).optional().nullable(),
})

export const updateSubcontractSchema = createSubcontractSchema.partial()

export const createPaymentSchema = z.object({
  subcontract_id: z.string().uuid(),
  period_description: z.string().min(1).max(255),
  gross_amount: z.string(),
  retention_amount: z.string(),
  net_amount: z.string(),
  status: z.enum(['pending', 'approved', 'paid']).default('pending'),
  payment_date: z.string().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
})

export const updatePaymentSchema = createPaymentSchema.partial()
