/**
 * Unit tests — academy_courses validators
 *
 * Venezuelan training academy context:
 *   - modality 'online': clases por Zoom/Meet — dominante en Venezuela por
 *     inseguridad vial y dispersión geográfica del estudiantado
 *   - modality 'hybrid': presencial + online (modelo post-pandemia)
 *   - price_usd coerce: acepta número o string numérico desde formularios
 *   - duration_hours coerce: admite string '40' desde query params
 *   - max_students default 20: grupo promedio de academia venezolana
 *   - passthrough: permite campos adicionales de configuración sin romper
 *
 * Nota §14: name usa z.string().min(2) — '' Y strings de 1 char son inválidos.
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 */

import { createCourseSchema, updateCourseSchema } from '../data/validators'

const validCourse = () => ({
  name: 'Excel Avanzado para Contadores',
  category: 'ofimática',
  level: 'avanzado',
  duration_hours: 40,
  price_usd: 75,
  modality: 'online' as const,
})

describe('createCourseSchema', () => {
  describe('required fields and defaults', () => {
    it('accepts a minimal valid course with defaults', () => {
      const r = createCourseSchema.safeParse(validCourse())
      expect(r.success).toBe(true)
      if (r.success) {
        expect(r.data.currency).toBe('USD')
        expect(r.data.max_students).toBe(20)
        expect(r.data.is_active).toBe(true)
      }
    })
    it('rejects name shorter than 2 chars (min(2))', () => {
      expect(createCourseSchema.safeParse({ ...validCourse(), name: 'X' }).success).toBe(false)
    })
    it('rejects missing category', () => {
      const { category: _o, ...rest } = validCourse()
      expect(createCourseSchema.safeParse(rest).success).toBe(false)
    })
    it('rejects duration_hours below 1', () => {
      expect(createCourseSchema.safeParse({ ...validCourse(), duration_hours: 0 }).success).toBe(false)
    })
    it('coerces duration_hours from string', () => {
      const r = createCourseSchema.safeParse({ ...validCourse(), duration_hours: '40' })
      expect(r.success).toBe(true)
      if (r.success) expect(r.data.duration_hours).toBe(40)
    })
    it('accepts price_usd = 0 (free course)', () => {
      expect(createCourseSchema.safeParse({ ...validCourse(), price_usd: 0 }).success).toBe(true)
    })
    it('coerces price_usd from string', () => {
      const r = createCourseSchema.safeParse({ ...validCourse(), price_usd: '75' })
      expect(r.success).toBe(true)
      if (r.success) expect(r.data.price_usd).toBe(75)
    })
    it('rejects max_students below 1', () => {
      expect(createCourseSchema.safeParse({ ...validCourse(), max_students: 0 }).success).toBe(false)
    })
    it('coerces max_students from string', () => {
      const r = createCourseSchema.safeParse({ ...validCourse(), max_students: '15' })
      expect(r.success).toBe(true)
      if (r.success) expect(r.data.max_students).toBe(15)
    })
    it('accepts description as null', () => {
      expect(createCourseSchema.safeParse({ ...validCourse(), description: null }).success).toBe(true)
    })
    it('passes through unknown fields (passthrough schema)', () => {
      const r = createCourseSchema.safeParse({ ...validCourse(), custom_field: 'val' })
      expect(r.success).toBe(true)
    })
  })

  describe('modality enum', () => {
    const modalities = ['in_person', 'online', 'hybrid'] as const
    test.each(modalities)('accepts modality "%s"', (modality) => {
      expect(createCourseSchema.safeParse({ ...validCourse(), modality }).success).toBe(true)
    })
    it('rejects invalid modality', () => {
      expect(createCourseSchema.safeParse({ ...validCourse(), modality: 'remote' }).success).toBe(false)
    })
  })
})

describe('updateCourseSchema', () => {
  it('accepts empty object', () => { expect(updateCourseSchema.safeParse({}).success).toBe(true) })
  it('accepts modality update', () => {
    expect(updateCourseSchema.safeParse({ modality: 'hybrid' }).success).toBe(true)
  })
  it('still rejects invalid modality in partial update', () => {
    expect(updateCourseSchema.safeParse({ modality: 'remote' }).success).toBe(false)
  })
})
