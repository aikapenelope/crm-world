/**
 * Unit tests — attendance validators
 *
 * Venezuelan school attendance context:
 *   - status 'excused': inasistencia justificada — requiere reposo médico
 *     del IVSS o certificado médico para ser aceptada por el plantel
 *   - status 'half_day': media jornada — salida anticipada autorizada por
 *     representante; registrada para cumplir normativa MPPE de asistencia
 *   - bulkRecordSchema: toma de asistencia masiva — profesor registra toda
 *     la sección en un solo acto (pase de lista)
 *   - updateRecordSchema omits student_id and date (immutable identifiers)
 *   - excuse_attachment_id: adjunto del reposo médico o carta del representante
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 */

import {
  createRecordSchema,
  updateRecordSchema,
  bulkRecordSchema,
} from '../data/validators'

const UUID  = '11111111-1111-4111-8111-111111111111'
const UUID2 = '22222222-2222-4222-8222-222222222222'

const validRecord = () => ({ student_id: UUID, date: '2026-01-15', status: 'present' as const })
const validBulk   = () => ({
  date: '2026-01-15',
  records: [
    { student_id: UUID,  status: 'present' as const },
    { student_id: UUID2, status: 'absent'  as const },
  ],
})

// ---------------------------------------------------------------------------
// createRecordSchema
// ---------------------------------------------------------------------------
describe('createRecordSchema', () => {
  it('accepts minimal attendance record', () => {
    expect(createRecordSchema.safeParse(validRecord()).success).toBe(true)
  })
  it('rejects non-UUID student_id', () => {
    expect(createRecordSchema.safeParse({ ...validRecord(), student_id: 'bad' }).success).toBe(false)
  })
  it('rejects empty date', () => {
    expect(createRecordSchema.safeParse({ ...validRecord(), date: '' }).success).toBe(false)
  })
  it('accepts date as plain string', () => {
    const r = createRecordSchema.safeParse(validRecord())
    expect(r.success).toBe(true)
    if (r.success) expect(typeof r.data.date).toBe('string')
  })
  it('accepts excuse_reason as null (present — no excuse needed)', () => {
    expect(createRecordSchema.safeParse({ ...validRecord(), excuse_reason: null }).success).toBe(true)
  })
  it('accepts excuse_attachment_id as UUID (reposo médico adjunto)', () => {
    expect(createRecordSchema.safeParse({ ...validRecord(), status: 'excused', excuse_attachment_id: UUID2 }).success).toBe(true)
  })
  it('accepts excuse_attachment_id as null', () => {
    expect(createRecordSchema.safeParse({ ...validRecord(), excuse_attachment_id: null }).success).toBe(true)
  })

  describe('status enum', () => {
    const statuses = ['present', 'absent', 'late', 'excused', 'half_day'] as const
    test.each(statuses)('accepts status "%s"', (status) => {
      expect(createRecordSchema.safeParse({ ...validRecord(), status }).success).toBe(true)
    })
    it('rejects invalid status', () => {
      expect(createRecordSchema.safeParse({ ...validRecord(), status: 'tardy' }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// updateRecordSchema (omits student_id and date)
// ---------------------------------------------------------------------------
describe('updateRecordSchema', () => {
  it('accepts empty object', () => { expect(updateRecordSchema.safeParse({}).success).toBe(true) })
  it('accepts status update (absent → excused after receiving reposo)', () => {
    expect(updateRecordSchema.safeParse({ status: 'excused' }).success).toBe(true)
  })
  it('accepts excuse_reason update', () => {
    expect(updateRecordSchema.safeParse({
      status: 'excused', excuse_reason: 'Reposo médico IVSS — fiebre',
    }).success).toBe(true)
  })
  it('still rejects invalid status in update', () => {
    expect(updateRecordSchema.safeParse({ status: 'tardy' }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// bulkRecordSchema — pase de lista completo
// ---------------------------------------------------------------------------
describe('bulkRecordSchema', () => {
  it('accepts valid bulk record', () => {
    expect(bulkRecordSchema.safeParse(validBulk()).success).toBe(true)
  })
  it('rejects empty date', () => {
    expect(bulkRecordSchema.safeParse({ ...validBulk(), date: '' }).success).toBe(false)
  })
  it('accepts empty records array (no students yet)', () => {
    expect(bulkRecordSchema.safeParse({ date: '2026-01-15', records: [] }).success).toBe(true)
  })
  it('rejects non-UUID student_id in a record', () => {
    expect(bulkRecordSchema.safeParse({
      date: '2026-01-15',
      records: [{ student_id: 'bad', status: 'present' }],
    }).success).toBe(false)
  })
  it('rejects invalid status in a bulk record', () => {
    expect(bulkRecordSchema.safeParse({
      date: '2026-01-15',
      records: [{ student_id: UUID, status: 'tardy' }],
    }).success).toBe(false)
  })
  it('accepts excuse_reason in individual record', () => {
    const r = bulkRecordSchema.safeParse({
      date: '2026-01-15',
      records: [{ student_id: UUID, status: 'excused', excuse_reason: 'Reposo médico' }],
    })
    expect(r.success).toBe(true)
  })
  it('accepts a full section of 30 students', () => {
    const uuid = (n: number) => `${n.toString().padStart(8,'0')}-0000-4000-8000-000000000000`
    const records = Array.from({ length: 30 }, (_, i) => ({
      student_id: uuid(i + 1),
      status: 'present' as const,
    }))
    expect(bulkRecordSchema.safeParse({ date: '2026-01-15', records }).success).toBe(true)
  })
})
