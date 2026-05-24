/**
 * Unit tests — enrollment validators
 *
 * Venezuelan school enrollment context:
 *   - school_year format: '2025-2026' (Venezuelan academic year spans two
 *     calendar years; MPPE nomenclature)
 *   - application_type 'renewal': reinscripción — annual process for
 *     existing students; largest enrollment volume
 *   - application_type 'transfer': traslado — requires planilla MPPE-002
 *     and approval from zone educational authority (ZONAS)
 *   - status 'documents_pending': documentación incompleta — common in
 *     Venezuelan schools due to migration, lost documents, apostilles
 *   - createDocumentSchema: documents required per MPPE: partida de
 *     nacimiento, cédula escolar, boletín anterior, carnet de vacunas
 *   - updateApplicationSchema omits period_id and applicant_contact_id
 *   - updateDocumentSchema omits application_id
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 */

import {
  createPeriodSchema,
  updatePeriodSchema,
  createApplicationSchema,
  updateApplicationSchema,
  createDocumentSchema,
  updateDocumentSchema,
} from '../data/validators'

const UUID  = '11111111-1111-4111-8111-111111111111'
const UUID2 = '22222222-2222-4222-8222-222222222222'

const validPeriod = () => ({
  name: 'Año Escolar 2025-2026',
  school_year: '2025-2026',
  start_date: '2025-09-15',
  end_date: '2026-07-15',
})

const validApp = () => ({
  period_id: UUID,
  applicant_contact_id: UUID2,
  application_type: 'renewal' as const,
  requested_grade: 'primaria_4',
})

const validDoc = () => ({
  application_id: UUID,
  document_type: 'partida_nacimiento',
})

// ---------------------------------------------------------------------------
// createPeriodSchema
// ---------------------------------------------------------------------------
describe('createPeriodSchema', () => {
  it('accepts minimal period with defaults', () => {
    const r = createPeriodSchema.safeParse(validPeriod())
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.status).toBe('open')
      expect(r.data.fee_currency).toBe('USD')
    }
  })
  it('rejects when name is missing', () => {
    const { name: _o, ...rest } = validPeriod()
    expect(createPeriodSchema.safeParse(rest).success).toBe(false)
  })
  it('rejects school_year below 4 chars', () => {
    expect(createPeriodSchema.safeParse({ ...validPeriod(), school_year: '202' }).success).toBe(false)
  })
  it('accepts start_date and end_date as plain strings', () => {
    const r = createPeriodSchema.safeParse(validPeriod())
    expect(r.success).toBe(true)
    if (r.success) {
      expect(typeof r.data.start_date).toBe('string')
      expect(r.data.start_date).toBe('2025-09-15')
    }
  })
  it('accepts enrollment_fee as null (no enrollment fee this period)', () => {
    expect(createPeriodSchema.safeParse({ ...validPeriod(), enrollment_fee: null }).success).toBe(true)
  })
  it('accepts enrollment_fee as USD amount string', () => {
    const r = createPeriodSchema.safeParse({ ...validPeriod(), enrollment_fee: '200.00' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.enrollment_fee).toBe('200.00')
  })

  describe('status enum', () => {
    const statuses = ['open', 'closed'] as const
    test.each(statuses)('accepts status "%s"', (status) => {
      expect(createPeriodSchema.safeParse({ ...validPeriod(), status }).success).toBe(true)
    })
    it('rejects invalid status', () => {
      expect(createPeriodSchema.safeParse({ ...validPeriod(), status: 'active' }).success).toBe(false)
    })
  })
})

describe('updatePeriodSchema', () => {
  it('accepts empty object', () => { expect(updatePeriodSchema.safeParse({}).success).toBe(true) })
  it('accepts status update (open → closed)', () => {
    expect(updatePeriodSchema.safeParse({ status: 'closed' }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// createApplicationSchema
// ---------------------------------------------------------------------------
describe('createApplicationSchema', () => {
  it('accepts minimal application with defaults', () => {
    const r = createApplicationSchema.safeParse(validApp())
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.status).toBe('pending')
  })
  it('rejects non-UUID period_id', () => {
    expect(createApplicationSchema.safeParse({ ...validApp(), period_id: 'bad' }).success).toBe(false)
  })
  it('rejects non-UUID applicant_contact_id', () => {
    expect(createApplicationSchema.safeParse({ ...validApp(), applicant_contact_id: 'bad' }).success).toBe(false)
  })
  it('rejects missing requested_grade', () => {
    const { requested_grade: _o, ...rest } = validApp()
    expect(createApplicationSchema.safeParse(rest).success).toBe(false)
  })
  it('accepts student_id as null (new applicant without student record)', () => {
    expect(createApplicationSchema.safeParse({ ...validApp(), student_id: null }).success).toBe(true)
  })
  it('accepts requested_section as null (no preference)', () => {
    expect(createApplicationSchema.safeParse({ ...validApp(), requested_section: null }).success).toBe(true)
  })

  describe('application_type enum', () => {
    const types = ['new', 'renewal', 'transfer'] as const
    test.each(types)('accepts application_type "%s"', (application_type) => {
      expect(createApplicationSchema.safeParse({ ...validApp(), application_type }).success).toBe(true)
    })
    it('rejects invalid application_type', () => {
      expect(createApplicationSchema.safeParse({ ...validApp(), application_type: 'exchange' }).success).toBe(false)
    })
  })

  describe('status enum', () => {
    const statuses = ['pending', 'documents_pending', 'approved', 'rejected', 'cancelled'] as const
    test.each(statuses)('accepts status "%s"', (status) => {
      expect(createApplicationSchema.safeParse({ ...validApp(), status }).success).toBe(true)
    })
    it('rejects invalid status', () => {
      expect(createApplicationSchema.safeParse({ ...validApp(), status: 'draft' }).success).toBe(false)
    })
  })
})

describe('updateApplicationSchema', () => {
  // omits period_id and applicant_contact_id
  it('accepts empty object', () => { expect(updateApplicationSchema.safeParse({}).success).toBe(true) })
  it('accepts status update', () => {
    expect(updateApplicationSchema.safeParse({ status: 'approved' }).success).toBe(true)
  })
  it('accepts requested_section update', () => {
    expect(updateApplicationSchema.safeParse({ requested_section: 'B' }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// createDocumentSchema
// ---------------------------------------------------------------------------
describe('createDocumentSchema', () => {
  it('accepts minimal document with defaults', () => {
    const r = createDocumentSchema.safeParse(validDoc())
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.status).toBe('pending')
  })
  it('rejects non-UUID application_id', () => {
    expect(createDocumentSchema.safeParse({ ...validDoc(), application_id: 'bad' }).success).toBe(false)
  })
  it('rejects missing document_type', () => {
    expect(createDocumentSchema.safeParse({ application_id: UUID }).success).toBe(false)
  })
  it('accepts attachment_id as UUID (document uploaded)', () => {
    expect(createDocumentSchema.safeParse({ ...validDoc(), attachment_id: UUID2 }).success).toBe(true)
  })
  it('accepts attachment_id as null (not yet uploaded)', () => {
    expect(createDocumentSchema.safeParse({ ...validDoc(), attachment_id: null }).success).toBe(true)
  })
  it('accepts rejection_reason as null', () => {
    expect(createDocumentSchema.safeParse({ ...validDoc(), rejection_reason: null }).success).toBe(true)
  })

  describe('status enum', () => {
    const statuses = ['pending', 'uploaded', 'approved', 'rejected'] as const
    test.each(statuses)('accepts status "%s"', (status) => {
      expect(createDocumentSchema.safeParse({ ...validDoc(), status }).success).toBe(true)
    })
    it('rejects invalid status', () => {
      expect(createDocumentSchema.safeParse({ ...validDoc(), status: 'missing' }).success).toBe(false)
    })
  })
})

describe('updateDocumentSchema', () => {
  // omits application_id
  it('accepts empty object', () => { expect(updateDocumentSchema.safeParse({}).success).toBe(true) })
  it('accepts status update (uploaded → approved)', () => {
    expect(updateDocumentSchema.safeParse({ status: 'approved' }).success).toBe(true)
  })
  it('accepts rejection_reason on rejection', () => {
    expect(updateDocumentSchema.safeParse({
      status: 'rejected', rejection_reason: 'Documento ilegible',
    }).success).toBe(true)
  })
})
