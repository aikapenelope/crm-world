import { z } from 'zod'

export const createTemplateSchema = z.object({
  template_type: z.enum(['constancia_estudio', 'constancia_inscripcion', 'constancia_notas', 'constancia_conducta', 'carta_recomendacion']),
  title: z.string().min(1).max(200),
  body_template: z.string().min(1),
  is_active: z.boolean().default(true),
})

export const updateTemplateSchema = createTemplateSchema.partial()

export const createGeneratedDocSchema = z.object({
  template_id: z.string().uuid(),
  student_id: z.string().uuid(),
  status: z.enum(['pending', 'generated', 'delivered']).default('pending'),
})

export const updateGeneratedDocSchema = createGeneratedDocSchema.partial().omit({ template_id: true, student_id: true })
