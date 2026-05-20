import { z } from 'zod'

// =============================================================================
// Student Validators
// =============================================================================

export const createStudentSchema = z.object({
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  cedula: z.string().max(20).optional().nullable(),
  birth_date: z.string().optional().nullable(),
  gender: z.enum(['masculino', 'femenino']).optional().nullable(),
  blood_type: z.string().max(5).optional().nullable(),
  photo_attachment_id: z.string().uuid().optional().nullable(),
  grade_level: z.enum([
    'maternal', 'preescolar_1', 'preescolar_2', 'preescolar_3',
    'primaria_1', 'primaria_2', 'primaria_3', 'primaria_4', 'primaria_5', 'primaria_6',
    'bachillerato_1', 'bachillerato_2', 'bachillerato_3', 'bachillerato_4', 'bachillerato_5',
  ]),
  section: z.string().max(5).default('A'),
  enrollment_status: z.enum(['active', 'graduated', 'withdrawn', 'suspended', 'transferred']).default('active'),
  enrollment_date: z.string().optional().nullable(),
  previous_school: z.string().max(255).optional().nullable(),
  medical_notes: z.string().optional().nullable(),
  allergies: z.string().optional().nullable(),
  emergency_contact_name: z.string().max(200).optional().nullable(),
  emergency_contact_phone: z.string().max(30).optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const updateStudentSchema = createStudentSchema.partial()

export type CreateStudentInput = z.infer<typeof createStudentSchema>
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>

// =============================================================================
// Representative Validators
// =============================================================================

export const createRepresentativeSchema = z.object({
  student_id: z.string().uuid(),
  contact_id: z.string().uuid(),
  relationship: z.enum(['padre', 'madre', 'abuelo', 'abuela', 'tio', 'tia', 'tutor_legal', 'otro']),
  is_primary: z.boolean().default(false),
  is_authorized_pickup: z.boolean().default(true),
})

export const updateRepresentativeSchema = createRepresentativeSchema.partial().omit({ student_id: true, contact_id: true })

export type CreateRepresentativeInput = z.infer<typeof createRepresentativeSchema>
export type UpdateRepresentativeInput = z.infer<typeof updateRepresentativeSchema>
