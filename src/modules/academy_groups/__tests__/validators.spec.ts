/**
 * Unit tests — academy_groups validators
 *
 * Venezuelan academy groups context:
 *   - schedule_days min(1): debe tener al menos un día de clase
 *   - schedule_time regex HH:MM: hora de inicio en formato 24h
 *   - start_date / end_date regex YYYY-MM-DD
 *   - session_duration_minutes min(30) max(480): 30 min a 8 horas por sesión
 *   - session_type 'makeup': clase de recuperación — común por feriados
 *     venezolanos imprevistos (CORPOELEC, inseguridad, feriados)
 *   - session_type 'orientation': inducción del grupo al inicio del curso
 *   - passthrough en todos los schemas
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 */

import {
  createGroupSchema,
  updateGroupSchema,
  createSessionSchema,
  updateSessionSchema,
} from '../data/validators'

const UUID  = '11111111-1111-4111-8111-111111111111'
const UUID2 = '22222222-2222-4222-8222-222222222222'

const validGroup = () => ({
  group_code: 'EXC-ADV-2026-01',
  course_id: UUID,
  start_date: '2026-01-20',
  end_date: '2026-04-20',
  schedule_days: ['tuesday', 'thursday'] as const,
  schedule_time: '18:00',
})

const validSession = () => ({
  group_id: UUID,
  session_number: 1,
  session_date: '2026-01-22',
  start_time: '18:00',
  end_time: '19:30',
})

// ---------------------------------------------------------------------------
// createGroupSchema
// ---------------------------------------------------------------------------
describe('createGroupSchema', () => {
  describe('required fields and defaults', () => {
    it('accepts minimal group with defaults', () => {
      const r = createGroupSchema.safeParse(validGroup())
      expect(r.success).toBe(true)
      if (r.success) {
        expect(r.data.session_duration_minutes).toBe(90)
        expect(r.data.max_students).toBe(20)
      }
    })
    it('rejects non-UUID course_id', () => {
      expect(createGroupSchema.safeParse({ ...validGroup(), course_id: 'bad' }).success).toBe(false)
    })
    it('rejects invalid start_date format', () => {
      expect(createGroupSchema.safeParse({ ...validGroup(), start_date: '20-01-2026' }).success).toBe(false)
    })
    it('accepts start_date and end_date in YYYY-MM-DD', () => {
      const r = createGroupSchema.safeParse(validGroup())
      expect(r.success).toBe(true)
      if (r.success) expect(r.data.start_date).toBe('2026-01-20')
    })
    it('rejects invalid schedule_time format', () => {
      expect(createGroupSchema.safeParse({ ...validGroup(), schedule_time: '6:00 PM' }).success).toBe(false)
    })
    it('accepts schedule_time in HH:MM format', () => {
      expect(createGroupSchema.safeParse({ ...validGroup(), schedule_time: '07:30' }).success).toBe(true)
    })
    it('rejects empty schedule_days array (min 1)', () => {
      expect(createGroupSchema.safeParse({ ...validGroup(), schedule_days: [] }).success).toBe(false)
    })
    it('rejects session_duration_minutes below 30', () => {
      expect(createGroupSchema.safeParse({ ...validGroup(), session_duration_minutes: 29 }).success).toBe(false)
    })
    it('rejects session_duration_minutes above 480', () => {
      expect(createGroupSchema.safeParse({ ...validGroup(), session_duration_minutes: 481 }).success).toBe(false)
    })
    it('coerces session_duration_minutes from string', () => {
      const r = createGroupSchema.safeParse({ ...validGroup(), session_duration_minutes: '120' })
      expect(r.success).toBe(true)
      if (r.success) expect(r.data.session_duration_minutes).toBe(120)
    })
    it('accepts instructor_id as null (sin instructor asignado)', () => {
      expect(createGroupSchema.safeParse({ ...validGroup(), instructor_id: null }).success).toBe(true)
    })
    it('passes through unknown fields', () => {
      expect(createGroupSchema.safeParse({ ...validGroup(), room: 'Aula 3' }).success).toBe(true)
    })
  })

  describe('schedule_days enum', () => {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const
    test.each(days)('accepts schedule day "%s"', (day) => {
      expect(createGroupSchema.safeParse({ ...validGroup(), schedule_days: [day] }).success).toBe(true)
    })
    it('rejects invalid day', () => {
      expect(createGroupSchema.safeParse({ ...validGroup(), schedule_days: ['lunes' as any] }).success).toBe(false)
    })
  })
})

describe('updateGroupSchema', () => {
  it('accepts empty object', () => { expect(updateGroupSchema.safeParse({}).success).toBe(true) })
  it('accepts schedule_time update', () => {
    expect(updateGroupSchema.safeParse({ schedule_time: '19:00' }).success).toBe(true)
  })
  it('still rejects invalid schedule_time', () => {
    expect(updateGroupSchema.safeParse({ schedule_time: '7pm' }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// createSessionSchema
// ---------------------------------------------------------------------------
describe('createSessionSchema', () => {
  it('accepts minimal session with defaults', () => {
    const r = createSessionSchema.safeParse(validSession())
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.session_type).toBe('theory')
      expect(r.data.status).toBe('scheduled')
    }
  })
  it('rejects session_number below 1', () => {
    expect(createSessionSchema.safeParse({ ...validSession(), session_number: 0 }).success).toBe(false)
  })
  it('coerces session_number from string', () => {
    const r = createSessionSchema.safeParse({ ...validSession(), session_number: '5' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.session_number).toBe(5)
  })
  it('rejects invalid session_date format', () => {
    expect(createSessionSchema.safeParse({ ...validSession(), session_date: '22/01/2026' }).success).toBe(false)
  })
  it('rejects invalid start_time format', () => {
    expect(createSessionSchema.safeParse({ ...validSession(), start_time: '6:00 PM' }).success).toBe(false)
  })
  it('accepts topic as null (TBD)', () => {
    expect(createSessionSchema.safeParse({ ...validSession(), topic: null }).success).toBe(true)
  })
  it('passes through unknown fields', () => {
    expect(createSessionSchema.safeParse({ ...validSession(), recording_url: 'https://x.com' }).success).toBe(true)
  })

  describe('session_type enum', () => {
    const types = ['theory', 'practice', 'exam', 'orientation', 'makeup'] as const
    test.each(types)('accepts session_type "%s"', (session_type) => {
      expect(createSessionSchema.safeParse({ ...validSession(), session_type }).success).toBe(true)
    })
    it('rejects invalid session_type', () => {
      expect(createSessionSchema.safeParse({ ...validSession(), session_type: 'workshop' }).success).toBe(false)
    })
  })

  describe('status enum', () => {
    const statuses = ['scheduled', 'completed', 'cancelled'] as const
    test.each(statuses)('accepts status "%s"', (status) => {
      expect(createSessionSchema.safeParse({ ...validSession(), status }).success).toBe(true)
    })
    it('rejects invalid status', () => {
      expect(createSessionSchema.safeParse({ ...validSession(), status: 'postponed' }).success).toBe(false)
    })
  })
})

describe('updateSessionSchema', () => {
  it('accepts empty object', () => { expect(updateSessionSchema.safeParse({}).success).toBe(true) })
  it('accepts status update (scheduled → completed)', () => {
    expect(updateSessionSchema.safeParse({ status: 'completed' }).success).toBe(true)
  })
})
