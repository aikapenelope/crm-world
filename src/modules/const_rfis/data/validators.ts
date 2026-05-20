import { z } from 'zod'

export const createRFISchema = z.object({
  project_id: z.string().uuid(),
  subject: z.string().min(1).max(255),
  description: z.string().min(1),
  discipline: z.enum(['civil', 'architectural', 'structural', 'electrical', 'mechanical', 'plumbing', 'other']).default('civil'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  status: z.enum(['open', 'pending_response', 'answered', 'closed', 'void']).default('open'),
  submitted_by: z.string().min(1).max(255),
  assigned_to: z.string().max(255).optional().nullable(),
  due_date: z.string().optional().nullable(),
  cost_impact: z.string().optional().nullable(),
  schedule_impact_days: z.coerce.number().optional().nullable(),
  linked_drawing: z.string().max(100).optional().nullable(),
})

export const updateRFISchema = createRFISchema.partial()

export const answerRFISchema = z.object({
  rfi_id: z.string().uuid(),
  answer: z.string().min(1),
  cost_impact: z.string().optional().nullable(),
  schedule_impact_days: z.coerce.number().optional().nullable(),
})

export const createSubmittalSchema = z.object({
  project_id: z.string().uuid(),
  title: z.string().min(1).max(255),
  spec_section: z.string().max(100).optional().nullable(),
  submittal_type: z.enum(['shop_drawing', 'product_data', 'sample', 'calculation', 'certificate', 'test_report']).default('product_data'),
  status: z.enum(['draft', 'submitted', 'under_review', 'approved', 'approved_as_noted', 'revise_resubmit', 'rejected']).default('draft'),
  submitted_by: z.string().min(1).max(255),
  reviewer: z.string().max(255).optional().nullable(),
  submitted_at: z.string().optional().nullable(),
  due_date: z.string().optional().nullable(),
  revision_number: z.coerce.number().min(1).default(1),
})

export const updateSubmittalSchema = createSubmittalSchema.partial()
