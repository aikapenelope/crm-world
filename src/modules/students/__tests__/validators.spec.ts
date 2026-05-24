/**
 * Unit tests — students validators
 *
 * Venezuelan K-12 student context:
 *   - grade_level enum follows Venezuelan education system:
 *     maternal → preescolar (3 años) → primaria (6 años) → bachillerato (5 años)
 *   - gender enum in Spanish: 'masculino' / 'femenino' (MPPE nomenclature)
 *   - cedula: cédula escolar (MPPE) o cédula de identidad (>12 años)
 *   - enrollment_status 'transferred': traslado — estudiante se inscribe en
 *     otra institución; requiere planilla de traslado del MPPE
 *   - section default 'A': sección de clase (A, B, C...)
 *   - relationship enum in Spanish (padre, madre, tutor_legal, etc.) — MPPE
 *     official nomenclature for representante legal
 *   - is_authorized_pickup: autorización de retiro — control de seguridad
 *     obligatorio en planteles venezolanos
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 */

import {
  createStudentSchema,
  updateStudentSchema,
  createRepresentativeSchema,
  updateRepresentativeSchema,
} from '../data/validators'

const UUID  = '11111111-1111-4111-8111-111111111111'
const UUID2 = '22222222-2222-4222-8222-222222222222'

const validStudent = () => ({
  first_name: 'Valentina',
  last_name: 'Pérez González',
  grade_level: 'primaria_3' as const,
})

const validRep = () => ({
  student_id: UUID,
  contact_id: UUID2,
  relationship: 'madre' as const,
})

// ---------------------------------------------------------------------------
// createStudentSchema
// ---------------------------------------------------------------------------
describe('createStudentSchema', () => {
  describe('required fields and defaults', () => {
    it('accepts a minimal valid student with defaults', () => {
      const r = createStudentSchema.safeParse(validStudent())
      expect(r.success).toBe(true)
      if (r.success) {
        expect(r.data.section).toBe('A')
        expect(r.data.enrollment_status).toBe('active')
      }
    })
    it('rejects when first_name is missing', () => {
      const { first_name: _o, ...rest } = validStudent()
      expect(createStudentSchema.safeParse(rest).success).toBe(false)
    })
    it('rejects when last_name is missing', () => {
      const { last_name: _o, ...rest } = validStudent()
      expect(createStudentSchema.safeParse(rest).success).toBe(false)
    })
    it('accepts cedula as null (menor sin cédula)', () => {
      expect(createStudentSchema.safeParse({ ...validStudent(), cedula: null }).success).toBe(true)
    })
    it('accepts birth_date as plain string', () => {
      const r = createStudentSchema.safeParse({ ...validStudent(), birth_date: '2015-06-10' })
      expect(r.success).toBe(true)
      if (r.success) expect(typeof r.data.birth_date).toBe('string')
    })
    it('accepts medical_notes and allergies as null', () => {
      expect(createStudentSchema.safeParse({
        ...validStudent(), medical_notes: null, allergies: null,
      }).success).toBe(true)
    })
    it('accepts emergency contact fields as null', () => {
      expect(createStudentSchema.safeParse({
        ...validStudent(), emergency_contact_name: null, emergency_contact_phone: null,
      }).success).toBe(true)
    })
    it('accepts previous_school as null (primera inscripción)', () => {
      expect(createStudentSchema.safeParse({ ...validStudent(), previous_school: null }).success).toBe(true)
    })
  })

  describe('grade_level enum — sistema educativo venezolano', () => {
    const levels = [
      'maternal',
      'preescolar_1', 'preescolar_2', 'preescolar_3',
      'primaria_1', 'primaria_2', 'primaria_3', 'primaria_4', 'primaria_5', 'primaria_6',
      'bachillerato_1', 'bachillerato_2', 'bachillerato_3', 'bachillerato_4', 'bachillerato_5',
    ] as const
    test.each(levels)('accepts grade_level "%s"', (grade_level) => {
      expect(createStudentSchema.safeParse({ ...validStudent(), grade_level }).success).toBe(true)
    })
    it('rejects invalid grade_level', () => {
      expect(createStudentSchema.safeParse({ ...validStudent(), grade_level: 'primaria_7' }).success).toBe(false)
    })
  })

  describe('enrollment_status enum', () => {
    const statuses = ['active', 'graduated', 'withdrawn', 'suspended', 'transferred'] as const
    test.each(statuses)('accepts enrollment_status "%s"', (enrollment_status) => {
      expect(createStudentSchema.safeParse({ ...validStudent(), enrollment_status }).success).toBe(true)
    })
    it('rejects invalid enrollment_status', () => {
      expect(createStudentSchema.safeParse({ ...validStudent(), enrollment_status: 'expelled' }).success).toBe(false)
    })
  })

  describe('gender enum — nomenclatura MPPE', () => {
    const genders = ['masculino', 'femenino'] as const
    test.each(genders)('accepts gender "%s"', (gender) => {
      expect(createStudentSchema.safeParse({ ...validStudent(), gender }).success).toBe(true)
    })
    it('rejects invalid gender', () => {
      expect(createStudentSchema.safeParse({ ...validStudent(), gender: 'male' }).success).toBe(false)
    })
    it('accepts gender as null', () => {
      expect(createStudentSchema.safeParse({ ...validStudent(), gender: null }).success).toBe(true)
    })
  })
})

describe('updateStudentSchema', () => {
  it('accepts empty object', () => { expect(updateStudentSchema.safeParse({}).success).toBe(true) })
  it('accepts enrollment_status update (active → graduated)', () => {
    expect(updateStudentSchema.safeParse({ enrollment_status: 'graduated' }).success).toBe(true)
  })
  it('accepts section update', () => {
    expect(updateStudentSchema.safeParse({ section: 'B' }).success).toBe(true)
  })
  it('still rejects invalid grade_level in partial update', () => {
    expect(updateStudentSchema.safeParse({ grade_level: 'primaria_7' }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// createRepresentativeSchema
// ---------------------------------------------------------------------------
describe('createRepresentativeSchema', () => {
  it('accepts minimal rep with defaults', () => {
    const r = createRepresentativeSchema.safeParse(validRep())
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.is_primary).toBe(false)
      expect(r.data.is_authorized_pickup).toBe(true)
    }
  })
  it('rejects non-UUID student_id', () => {
    expect(createRepresentativeSchema.safeParse({ ...validRep(), student_id: 'bad' }).success).toBe(false)
  })
  it('rejects non-UUID contact_id', () => {
    expect(createRepresentativeSchema.safeParse({ ...validRep(), contact_id: 'bad' }).success).toBe(false)
  })

  describe('relationship enum — nomenclatura MPPE', () => {
    const rels = ['padre', 'madre', 'abuelo', 'abuela', 'tio', 'tia', 'tutor_legal', 'otro'] as const
    test.each(rels)('accepts relationship "%s"', (relationship) => {
      expect(createRepresentativeSchema.safeParse({ ...validRep(), relationship }).success).toBe(true)
    })
    it('rejects invalid relationship', () => {
      expect(createRepresentativeSchema.safeParse({ ...validRep(), relationship: 'guardian' }).success).toBe(false)
    })
  })
})

describe('updateRepresentativeSchema', () => {
  // updateRepresentativeSchema omits student_id and contact_id
  it('accepts empty object', () => { expect(updateRepresentativeSchema.safeParse({}).success).toBe(true) })
  it('accepts is_primary update', () => {
    expect(updateRepresentativeSchema.safeParse({ is_primary: true }).success).toBe(true)
  })
  it('accepts is_authorized_pickup update', () => {
    expect(updateRepresentativeSchema.safeParse({ is_authorized_pickup: false }).success).toBe(true)
  })
})
