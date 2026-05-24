/**
 * Unit tests — academy_enrollments validators
 *
 * Venezuelan academy enrollment context:
 *   - status 'pending_payment': matrícula pendiente de pago — el alumno
 *     reservó pero no ha cancelado; período de espera antes de confirmar
 *   - status 'withdrawn': retiro — solicitud de devolución (Ley de defensa
 *     del consumidor venezolana aplica en servicios educativos)
 *   - price_agreed coerce: precio negociado, puede llegar como string
 *   - enrollment_date regex /^\d{4}-\d{2}-\d{2}$/: fecha de matrícula
 *     (opcional — puede registrarse después del pago)
 *   - student_name min(2): nombre completo requerido
 *   - passthrough: campos adicionales de perfil del alumno
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 */

import { createEnrollmentSchema, updateEnrollmentSchema } from '../data/validators'

const UUID = '11111111-1111-4111-8111-111111111111'

const validEnrollment = () => ({
  group_id: UUID,
  student_name: 'María Fernández',
  price_agreed: 75,
})

describe('createEnrollmentSchema', () => {
  describe('required fields and defaults', () => {
    it('accepts minimal enrollment with defaults', () => {
      const r = createEnrollmentSchema.safeParse(validEnrollment())
      expect(r.success).toBe(true)
      if (r.success) {
        expect(r.data.status).toBe('pending_payment')
        expect(r.data.currency).toBe('USD')
      }
    })
    it('rejects non-UUID group_id', () => {
      expect(createEnrollmentSchema.safeParse({ ...validEnrollment(), group_id: 'bad' }).success).toBe(false)
    })
    it('rejects student_name shorter than 2 chars', () => {
      expect(createEnrollmentSchema.safeParse({ ...validEnrollment(), student_name: 'A' }).success).toBe(false)
    })
    it('coerces price_agreed from string', () => {
      const r = createEnrollmentSchema.safeParse({ ...validEnrollment(), price_agreed: '75' })
      expect(r.success).toBe(true)
      if (r.success) expect(r.data.price_agreed).toBe(75)
    })
    it('accepts price_agreed = 0 (beca completa)', () => {
      expect(createEnrollmentSchema.safeParse({ ...validEnrollment(), price_agreed: 0 }).success).toBe(true)
    })
    it('accepts valid enrollment_date in YYYY-MM-DD format', () => {
      const r = createEnrollmentSchema.safeParse({ ...validEnrollment(), enrollment_date: '2026-01-15' })
      expect(r.success).toBe(true)
      if (r.success) expect(r.data.enrollment_date).toBe('2026-01-15')
    })
    it('rejects enrollment_date with wrong format', () => {
      expect(createEnrollmentSchema.safeParse({ ...validEnrollment(), enrollment_date: '15/01/2026' }).success).toBe(false)
    })
    it('accepts student_email as valid email', () => {
      expect(createEnrollmentSchema.safeParse({ ...validEnrollment(), student_email: 'maria@gmail.com' }).success).toBe(true)
    })
    it('rejects invalid student_email', () => {
      expect(createEnrollmentSchema.safeParse({ ...validEnrollment(), student_email: 'not-email' }).success).toBe(false)
    })
    it('accepts student_email as null', () => {
      expect(createEnrollmentSchema.safeParse({ ...validEnrollment(), student_email: null }).success).toBe(true)
    })
    it('passes through unknown fields', () => {
      expect(createEnrollmentSchema.safeParse({ ...validEnrollment(), cedula: 'V-12345678' }).success).toBe(true)
    })
  })

  describe('status enum', () => {
    const statuses = ['pending_payment', 'active', 'completed', 'withdrawn', 'failed'] as const
    test.each(statuses)('accepts status "%s"', (status) => {
      expect(createEnrollmentSchema.safeParse({ ...validEnrollment(), status }).success).toBe(true)
    })
    it('rejects invalid status', () => {
      expect(createEnrollmentSchema.safeParse({ ...validEnrollment(), status: 'cancelled' }).success).toBe(false)
    })
  })
})

describe('updateEnrollmentSchema', () => {
  it('accepts empty object', () => { expect(updateEnrollmentSchema.safeParse({}).success).toBe(true) })
  it('accepts status update (pending_payment → active)', () => {
    expect(updateEnrollmentSchema.safeParse({ status: 'active' }).success).toBe(true)
  })
})
