/**
 * Unit tests — grades validators
 *
 * Venezuelan K-12 grades context:
 *   - period_number 1-4: Venezuela uses 4 academic periods (lapsos) per year
 *     in most schools (MPPE decree); private schools may use trimestres
 *   - is_qualitative: materias cualitativas — Educación Física, Arte,
 *     Música, Desarrollo Personal; scored as 'A', 'B', 'C', 'D', 'E'
 *     instead of numeric (MPPE normative)
 *   - score: nota numérica (1-20 scale in Venezuela, MPPE standard)
 *   - qualitative_score max 5 chars: 'A', 'B', 'C', 'D', 'E' or 'Aprob'
 *   - report card status 'published': boletín publicado — representative
 *     can view grades in the system
 *   - updateGradeSchema omits student_id, subject_id, period_id (immutable)
 *   - updateReportCardSchema omits student_id and period_id
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 */

import {
  createSubjectSchema,
  updateSubjectSchema,
  createPeriodSchema,
  updatePeriodSchema,
  createGradeSchema,
  updateGradeSchema,
  createReportCardSchema,
  updateReportCardSchema,
} from '../data/validators'

const UUID  = '11111111-1111-4111-8111-111111111111'
const UUID2 = '22222222-2222-4222-8222-222222222222'
const UUID3 = '33333333-3333-4333-8333-333333333333'

const validSubject = () => ({ name: 'Matemáticas', code: 'MAT' })
const validPeriod  = () => ({
  school_year: '2025-2026', period_number: 1, name: 'Primer Lapso',
  start_date: '2025-09-15', end_date: '2025-12-15',
})
const validGrade   = () => ({ student_id: UUID, subject_id: UUID2, period_id: UUID3 })
const validCard    = () => ({ student_id: UUID, period_id: UUID2 })

// ---------------------------------------------------------------------------
// createSubjectSchema
// ---------------------------------------------------------------------------
describe('createSubjectSchema', () => {
  it('accepts minimal subject with defaults', () => {
    const r = createSubjectSchema.safeParse(validSubject())
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.is_qualitative).toBe(false)
      expect(r.data.sort_order).toBe(0)
      expect(r.data.is_active).toBe(true)
    }
  })
  it('rejects missing name', () => {
    expect(createSubjectSchema.safeParse({ code: 'MAT' }).success).toBe(false)
  })
  it('rejects missing code', () => {
    expect(createSubjectSchema.safeParse({ name: 'Matemáticas' }).success).toBe(false)
  })
  it('accepts is_qualitative = true (Ed. Física, Arte, Música)', () => {
    const r = createSubjectSchema.safeParse({ ...validSubject(), is_qualitative: true })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.is_qualitative).toBe(true)
  })
  it('coerces sort_order from string', () => {
    const r = createSubjectSchema.safeParse({ ...validSubject(), sort_order: '3' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.sort_order).toBe(3)
  })
  it('accepts grade_levels array of strings', () => {
    const r = createSubjectSchema.safeParse({
      ...validSubject(), grade_levels: ['primaria_1', 'primaria_2', 'primaria_3'],
    })
    expect(r.success).toBe(true)
  })
  it('accepts grade_levels as null (all grades)', () => {
    expect(createSubjectSchema.safeParse({ ...validSubject(), grade_levels: null }).success).toBe(true)
  })
})

describe('updateSubjectSchema', () => {
  it('accepts empty object', () => { expect(updateSubjectSchema.safeParse({}).success).toBe(true) })
  it('accepts is_active update', () => {
    expect(updateSubjectSchema.safeParse({ is_active: false }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// createPeriodSchema (grades — lapso académico)
// ---------------------------------------------------------------------------
describe('createPeriodSchema', () => {
  it('accepts minimal period with defaults', () => {
    const r = createPeriodSchema.safeParse(validPeriod())
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.is_active).toBe(false)
  })
  it('rejects period_number below 1', () => {
    expect(createPeriodSchema.safeParse({ ...validPeriod(), period_number: 0 }).success).toBe(false)
  })
  it('rejects period_number above 4', () => {
    expect(createPeriodSchema.safeParse({ ...validPeriod(), period_number: 5 }).success).toBe(false)
  })
  it('coerces period_number from string', () => {
    const r = createPeriodSchema.safeParse({ ...validPeriod(), period_number: '2' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.period_number).toBe(2)
  })
  it('accepts start_date and end_date as plain strings', () => {
    const r = createPeriodSchema.safeParse(validPeriod())
    expect(r.success).toBe(true)
    if (r.success) {
      expect(typeof r.data.start_date).toBe('string')
      expect(r.data.start_date).toBe('2025-09-15')
    }
  })
  it('rejects school_year below 4 chars', () => {
    expect(createPeriodSchema.safeParse({ ...validPeriod(), school_year: '202' }).success).toBe(false)
  })

  describe('all 4 lapsos accepted', () => {
    const periods = [1, 2, 3, 4] as const
    test.each(periods)('accepts period_number %d', (period_number) => {
      expect(createPeriodSchema.safeParse({ ...validPeriod(), period_number }).success).toBe(true)
    })
  })
})

describe('updatePeriodSchema', () => {
  it('accepts empty object', () => { expect(updatePeriodSchema.safeParse({}).success).toBe(true) })
  it('accepts is_active update', () => {
    expect(updatePeriodSchema.safeParse({ is_active: true }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// createGradeSchema
// ---------------------------------------------------------------------------
describe('createGradeSchema', () => {
  it('accepts minimal grade (no score yet — grade book open)', () => {
    expect(createGradeSchema.safeParse(validGrade()).success).toBe(true)
  })
  it('rejects non-UUID student_id', () => {
    expect(createGradeSchema.safeParse({ ...validGrade(), student_id: 'bad' }).success).toBe(false)
  })
  it('rejects non-UUID subject_id', () => {
    expect(createGradeSchema.safeParse({ ...validGrade(), subject_id: 'bad' }).success).toBe(false)
  })
  it('accepts score as numeric string (MPPE scale 1-20)', () => {
    const r = createGradeSchema.safeParse({ ...validGrade(), score: '18' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.score).toBe('18')
  })
  it('accepts score as null (not yet graded)', () => {
    expect(createGradeSchema.safeParse({ ...validGrade(), score: null }).success).toBe(true)
  })
  it('accepts qualitative_score "A" (Ed. Física)', () => {
    const r = createGradeSchema.safeParse({ ...validGrade(), qualitative_score: 'A' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.qualitative_score).toBe('A')
  })
  it('accepts qualitative_score as null (numeric subject)', () => {
    expect(createGradeSchema.safeParse({ ...validGrade(), qualitative_score: null }).success).toBe(true)
  })
  it('rejects qualitative_score above 5 chars', () => {
    expect(createGradeSchema.safeParse({ ...validGrade(), qualitative_score: 'APROBA' }).success).toBe(false)
  })
  it('accepts observations as null', () => {
    expect(createGradeSchema.safeParse({ ...validGrade(), observations: null }).success).toBe(true)
  })
})

describe('updateGradeSchema', () => {
  // omits student_id, subject_id, period_id
  it('accepts empty object', () => { expect(updateGradeSchema.safeParse({}).success).toBe(true) })
  it('accepts score update', () => {
    expect(updateGradeSchema.safeParse({ score: '15' }).success).toBe(true)
  })
  it('accepts observations update', () => {
    expect(updateGradeSchema.safeParse({ observations: 'Debe reforzar multiplicación' }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// createReportCardSchema
// ---------------------------------------------------------------------------
describe('createReportCardSchema', () => {
  it('accepts minimal report card with defaults', () => {
    const r = createReportCardSchema.safeParse(validCard())
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.status).toBe('draft')
  })
  it('rejects non-UUID student_id', () => {
    expect(createReportCardSchema.safeParse({ ...validCard(), student_id: 'bad' }).success).toBe(false)
  })
  it('accepts average_score as string', () => {
    const r = createReportCardSchema.safeParse({ ...validCard(), average_score: '17.50' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.average_score).toBe('17.50')
  })
  it('accepts average_score as null (not yet calculated)', () => {
    expect(createReportCardSchema.safeParse({ ...validCard(), average_score: null }).success).toBe(true)
  })
  it('accepts teacher_name as null', () => {
    expect(createReportCardSchema.safeParse({ ...validCard(), teacher_name: null }).success).toBe(true)
  })

  describe('status enum', () => {
    const statuses = ['draft', 'published', 'delivered'] as const
    test.each(statuses)('accepts status "%s"', (status) => {
      expect(createReportCardSchema.safeParse({ ...validCard(), status }).success).toBe(true)
    })
    it('rejects invalid status', () => {
      expect(createReportCardSchema.safeParse({ ...validCard(), status: 'approved' }).success).toBe(false)
    })
  })
})

describe('updateReportCardSchema', () => {
  // omits student_id and period_id
  it('accepts empty object', () => { expect(updateReportCardSchema.safeParse({}).success).toBe(true) })
  it('accepts status update (draft → published)', () => {
    expect(updateReportCardSchema.safeParse({ status: 'published' }).success).toBe(true)
  })
  it('accepts average_score and general_observations update', () => {
    expect(updateReportCardSchema.safeParse({
      average_score: '16.80', general_observations: 'Buen desempeño académico',
    }).success).toBe(true)
  })
})
