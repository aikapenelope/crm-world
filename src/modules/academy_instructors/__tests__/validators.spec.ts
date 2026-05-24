/**
 * Unit tests — academy_instructors validators
 *
 * Venezuelan academy instructor context:
 *   - hourly_rate_usd coerce: tarifa por hora en USD (estándar para
 *     instructores venezolanos — evita devaluación del Bolívar)
 *   - modalities: array de modalidades que domina el instructor
 *   - name min(2): nombre completo requerido
 *   - passthrough: admite campos adicionales (CV, certificaciones, etc.)
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 */

import { createInstructorSchema, updateInstructorSchema } from '../data/validators'

const validInstructor = () => ({ name: 'Prof. Carlos Rodríguez' })

describe('createInstructorSchema', () => {
  it('accepts minimal instructor with defaults', () => {
    const r = createInstructorSchema.safeParse(validInstructor())
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.is_active).toBe(true)
  })
  it('rejects name shorter than 2 chars', () => {
    expect(createInstructorSchema.safeParse({ name: 'A' }).success).toBe(false)
  })
  it('accepts valid email', () => {
    expect(createInstructorSchema.safeParse({ ...validInstructor(), email: 'prof@academia.com' }).success).toBe(true)
  })
  it('rejects invalid email', () => {
    expect(createInstructorSchema.safeParse({ ...validInstructor(), email: 'bad' }).success).toBe(false)
  })
  it('accepts email as null', () => {
    expect(createInstructorSchema.safeParse({ ...validInstructor(), email: null }).success).toBe(true)
  })
  it('accepts hourly_rate_usd as a number', () => {
    const r = createInstructorSchema.safeParse({ ...validInstructor(), hourly_rate_usd: 25 })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.hourly_rate_usd).toBe(25)
  })
  it('coerces hourly_rate_usd from string', () => {
    const r = createInstructorSchema.safeParse({ ...validInstructor(), hourly_rate_usd: '30' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.hourly_rate_usd).toBe(30)
  })
  it('accepts hourly_rate_usd as null (rate TBD)', () => {
    expect(createInstructorSchema.safeParse({ ...validInstructor(), hourly_rate_usd: null }).success).toBe(true)
  })
  it('accepts modalities as string array', () => {
    const r = createInstructorSchema.safeParse({ ...validInstructor(), modalities: ['online', 'in_person'] })
    expect(r.success).toBe(true)
  })
  it('accepts modalities as null', () => {
    expect(createInstructorSchema.safeParse({ ...validInstructor(), modalities: null }).success).toBe(true)
  })
  it('accepts optional bio and specialty as null', () => {
    expect(createInstructorSchema.safeParse({ ...validInstructor(), bio: null, specialty: null }).success).toBe(true)
  })
  it('passes through unknown fields', () => {
    expect(createInstructorSchema.safeParse({ ...validInstructor(), linkedin: 'https://linkedin.com/prof' }).success).toBe(true)
  })
})

describe('updateInstructorSchema', () => {
  it('accepts empty object', () => { expect(updateInstructorSchema.safeParse({}).success).toBe(true) })
  it('accepts is_active update', () => {
    expect(updateInstructorSchema.safeParse({ is_active: false }).success).toBe(true)
  })
  it('accepts hourly_rate_usd update', () => {
    expect(updateInstructorSchema.safeParse({ hourly_rate_usd: 35 }).success).toBe(true)
  })
})
