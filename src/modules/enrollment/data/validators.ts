import { z } from 'zod'

// =============================================================================
// Period Validators
// =============================================================================

export const createPeriodSchema = z.object({
  name: z.string().min(1).max(100),
  school_year: z.string().min(4).max(20),
  start_date: z.string(),
  end_date: z.string(),
  status: z.enum(['open', 'closed']).default('open'),
  enrollment_fee: z.string().optional().nullable(),
  fee_currency: z.string().max(10).default('USD'),
})

export const updatePeriodSchema = createPeriodSchema.partial()

// =============================================================================
// Application Validators
// =============================================================================

export const createApplicationSchema = z.object({
  period_id: z.string().uuid(),
  student_id: z.string().uuid().optional().nullable(),
  applicant_contact_id: z.string().uuid(),
  application_type: z.enum(['new', 'renewal', 'transfer']),
  requested_grade: z.string().min(1).max(20),
  requested_section: z.string().max(5).optional().nullable(),
  status: z.enum(['pending', 'documents_pending', 'approved', 'rejected', 'cancelled']).default('pending'),
  notes: z.string().optional().nullable(),
})

export const updateApplicationSchema = createApplicationSchema.partial().omit({
  period_id: true,
  applicant_contact_id: true,
})

// =============================================================================
// Document Validators
// =============================================================================

export const createDocumentSchema = z.object({
  application_id: z.string().uuid(),
  document_type: z.string().min(1).max(50),
  attachment_id: z.string().uuid().optional().nullable(),
  status: z.enum(['pending', 'uploaded', 'approved', 'rejected']).default('pending'),
  rejection_reason: z.string().optional().nullable(),
})

export const updateDocumentSchema = createDocumentSchema.partial().omit({ application_id: true })
