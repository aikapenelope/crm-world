/**
 * Unit tests — academy_sessions validators
 *
 * Venezuelan academy sessions context (standalone module):
 *   - Mirrors createSessionSchema / updateSessionSchema from academy_groups
 *   - session_type 'makeup': recuperación por ausencias o feriados
 *   - schedule_time regex HH:MM (24h format)
 *   - session_date regex YYYY-MM-DD
 *   - passthrough: permite campos extras (recording_url, zoom_link, etc.)
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 */

import { createSessionSchema, updateSessionSchema } from '../data/validators'

const UUID = '11111111-1111-4111-8111-111111111111'

const validSession = () => ({
  group_id: UUID,
  session_number: 1,
  session_date: '2026-01-22',
  start_time: '18:00',
  end_time: '19:30',
})

describe('createSessionSchema', () => {
  describe('required fields and defaults', () => {
    it('accepts minimal session with defaults', () => {
      const r = createSessionSchema.safeParse(validSession())
      expect(r.success).toBe(true)
      if (r.success) {
        expect(r.data.session_type).toBe('theory')
        expect(r.data.status).toBe('scheduled')
      }
    })
    it('rejects non-UUID group_id', () => {
      expect(createSessionSchema.safeParse({ ...validSession(), group_id: 'bad' }).success).toBe(false)
    })
    it('rejects session_number below 1', () => {
      expect(createSessionSchema.safeParse({ ...validSession(), session_number: 0 }).success).toBe(false)
    })
    it('coerces session_number from string', () => {
      const r = createSessionSchema.safeParse({ ...validSession(), session_number: '3' })
      expect(r.success).toBe(true)
      if (r.success) expect(r.data.session_number).toBe(3)
    })
    it('rejects session_date in wrong format (DDMMYYYY)', () => {
      expect(createSessionSchema.safeParse({ ...validSession(), session_date: '22012026' }).success).toBe(false)
    })
    it('rejects start_time not matching HH:MM', () => {
      expect(createSessionSchema.safeParse({ ...validSession(), start_time: '6pm' }).success).toBe(false)
    })
    it('accepts topic as null', () => {
      expect(createSessionSchema.safeParse({ ...validSession(), topic: null }).success).toBe(true)
    })
    it('accepts instructor_notes as null', () => {
      expect(createSessionSchema.safeParse({ ...validSession(), instructor_notes: null }).success).toBe(true)
    })
    it('passes through unknown fields', () => {
      expect(createSessionSchema.safeParse({ ...validSession(), zoom_link: 'https://zoom.us/j/123' }).success).toBe(true)
    })
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
  it('accepts status-only update', () => {
    expect(updateSessionSchema.safeParse({ status: 'completed' }).success).toBe(true)
  })
  it('accepts topic update', () => {
    expect(updateSessionSchema.safeParse({ topic: 'Tablas dinámicas avanzadas' }).success).toBe(true)
  })
})
