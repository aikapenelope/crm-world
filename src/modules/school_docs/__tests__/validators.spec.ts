/**
 * Unit tests — school_docs validators
 *
 * Venezuelan school document context:
 *   - template_type enum uses official Venezuelan document names (constancias):
 *     'constancia_estudio': constancia de estudios — more requested doc in VEN
 *       schools; required for bank accounts, IVSS, ID renewals, visas
 *     'constancia_inscripcion': constancia de inscripción — official enrollment
 *       proof; required for student transport subsidies and benefits
 *     'constancia_notas': constancia de notas — academic transcript
 *     'constancia_conducta': constancia de buena conducta — for employment,
 *       visa applications, and university admissions
 *     'carta_recomendacion': carta de recomendación — teacher recommendation
 *       letter for university applications
 *   - updateGeneratedDocSchema omits template_id and student_id
 *   - status 'generated': documento PDF generado — listo para entrega
 *   - status 'delivered': entregado al representante — firmado y sellado
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 */

import {
  createTemplateSchema,
  updateTemplateSchema,
  createGeneratedDocSchema,
  updateGeneratedDocSchema,
} from '../data/validators'

const UUID  = '11111111-1111-4111-8111-111111111111'
const UUID2 = '22222222-2222-4222-8222-222222222222'

const validTemplate = () => ({
  template_type: 'constancia_estudio' as const,
  title: 'Constancia de Estudios — Formato MPPE',
  body_template: 'El plantel [NOMBRE_COLEGIO] hace constar que el/la alumno/a [NOMBRE_ESTUDIANTE] cursa el [GRADO]...',
})
const validDoc = () => ({ template_id: UUID, student_id: UUID2 })

// ---------------------------------------------------------------------------
// createTemplateSchema
// ---------------------------------------------------------------------------
describe('createTemplateSchema', () => {
  it('accepts minimal template with defaults', () => {
    const r = createTemplateSchema.safeParse(validTemplate())
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.is_active).toBe(true)
  })
  it('rejects empty title', () => {
    expect(createTemplateSchema.safeParse({ ...validTemplate(), title: '' }).success).toBe(false)
  })
  it('rejects empty body_template', () => {
    expect(createTemplateSchema.safeParse({ ...validTemplate(), body_template: '' }).success).toBe(false)
  })
  it('accepts is_active = false (deprecated template)', () => {
    const r = createTemplateSchema.safeParse({ ...validTemplate(), is_active: false })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.is_active).toBe(false)
  })

  describe('template_type enum — constancias venezolanas', () => {
    const types = [
      'constancia_estudio',
      'constancia_inscripcion',
      'constancia_notas',
      'constancia_conducta',
      'carta_recomendacion',
    ] as const
    test.each(types)('accepts template_type "%s"', (template_type) => {
      expect(createTemplateSchema.safeParse({ ...validTemplate(), template_type }).success).toBe(true)
    })
    it('rejects invalid template_type', () => {
      expect(createTemplateSchema.safeParse({ ...validTemplate(), template_type: 'certificate' }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// updateTemplateSchema
// ---------------------------------------------------------------------------
describe('updateTemplateSchema', () => {
  it('accepts empty object', () => { expect(updateTemplateSchema.safeParse({}).success).toBe(true) })
  it('accepts body_template update (template revision)', () => {
    expect(updateTemplateSchema.safeParse({ body_template: 'Nuevo formato actualizado...' }).success).toBe(true)
  })
  it('accepts is_active update', () => {
    expect(updateTemplateSchema.safeParse({ is_active: false }).success).toBe(true)
  })
  it('still rejects invalid template_type in partial update', () => {
    expect(updateTemplateSchema.safeParse({ template_type: 'certificate' }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// createGeneratedDocSchema
// ---------------------------------------------------------------------------
describe('createGeneratedDocSchema', () => {
  it('accepts minimal generated doc with defaults', () => {
    const r = createGeneratedDocSchema.safeParse(validDoc())
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.status).toBe('pending')
  })
  it('rejects non-UUID template_id', () => {
    expect(createGeneratedDocSchema.safeParse({ ...validDoc(), template_id: 'bad' }).success).toBe(false)
  })
  it('rejects non-UUID student_id', () => {
    expect(createGeneratedDocSchema.safeParse({ ...validDoc(), student_id: 'bad' }).success).toBe(false)
  })

  describe('status enum — constancia lifecycle', () => {
    const statuses = ['pending', 'generated', 'delivered'] as const
    test.each(statuses)('accepts status "%s"', (status) => {
      expect(createGeneratedDocSchema.safeParse({ ...validDoc(), status }).success).toBe(true)
    })
    it('rejects invalid status', () => {
      expect(createGeneratedDocSchema.safeParse({ ...validDoc(), status: 'approved' }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// updateGeneratedDocSchema (omits template_id and student_id)
// ---------------------------------------------------------------------------
describe('updateGeneratedDocSchema', () => {
  it('accepts empty object', () => { expect(updateGeneratedDocSchema.safeParse({}).success).toBe(true) })
  it('accepts status update (pending → generated)', () => {
    expect(updateGeneratedDocSchema.safeParse({ status: 'generated' }).success).toBe(true)
  })
  it('accepts status update (generated → delivered)', () => {
    expect(updateGeneratedDocSchema.safeParse({ status: 'delivered' }).success).toBe(true)
  })
  it('still rejects invalid status', () => {
    expect(updateGeneratedDocSchema.safeParse({ status: 'approved' }).success).toBe(false)
  })
})
