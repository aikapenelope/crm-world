/**
 * Unit tests — school_calendar validators
 *
 * Venezuelan school calendar context:
 *   - event_type 'class_day': día de clase — calendario escolar MPPE
 *   - event_type 'holiday': feriado — feriados nacionales venezolanos
 *     (Semana Santa, Carnaval, 5 Jul, 24 Jul, 12 Oct, 17 Dic, etc.)
 *   - event_type 'exam_period': período de evaluación — lapso de evaluaciones
 *   - event_type 'graduation': acto de grado — Bachilleres y 6to grado
 *   - event_type 'administrative': días administrativos (sin clases)
 *   - applies_to_grades: array de grados afectados — e.g. solo bachillerato
 *     tiene días de evaluación diferenciados del resto del plantel
 *   - is_all_day default true: la mayoría de eventos escolares son todo el día
 *   - Dates as plain strings (YYYY-MM-DD)
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 */

import {
  createEventSchema,
  updateEventSchema,
} from '../data/validators'

const validEvent = () => ({
  title: 'Inicio del Año Escolar 2025-2026',
  event_type: 'class_day' as const,
  start_date: '2025-09-15',
  end_date: '2025-09-15',
})

// ---------------------------------------------------------------------------
// createEventSchema
// ---------------------------------------------------------------------------
describe('createEventSchema', () => {
  it('accepts minimal event with defaults', () => {
    const r = createEventSchema.safeParse(validEvent())
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.is_all_day).toBe(true)
  })
  it('rejects empty title', () => {
    expect(createEventSchema.safeParse({ ...validEvent(), title: '' }).success).toBe(false)
  })
  it('rejects missing start_date', () => {
    const { start_date: _o, ...rest } = validEvent()
    expect(createEventSchema.safeParse(rest).success).toBe(false)
  })
  it('rejects missing end_date', () => {
    const { end_date: _o, ...rest } = validEvent()
    expect(createEventSchema.safeParse(rest).success).toBe(false)
  })
  it('accepts start_date and end_date as plain strings', () => {
    const r = createEventSchema.safeParse(validEvent())
    expect(r.success).toBe(true)
    if (r.success) {
      expect(typeof r.data.start_date).toBe('string')
      expect(r.data.start_date).toBe('2025-09-15')
    }
  })
  it('accepts a multi-day event (Semana Santa)', () => {
    const r = createEventSchema.safeParse({
      ...validEvent(),
      event_type: 'holiday',
      title: 'Semana Santa',
      start_date: '2026-04-02',
      end_date: '2026-04-10',
    })
    expect(r.success).toBe(true)
  })
  it('accepts applies_to_grades as string array', () => {
    const r = createEventSchema.safeParse({
      ...validEvent(), event_type: 'exam_period',
      applies_to_grades: ['bachillerato_4', 'bachillerato_5'],
    })
    expect(r.success).toBe(true)
  })
  it('accepts applies_to_grades as null (all grades)', () => {
    expect(createEventSchema.safeParse({ ...validEvent(), applies_to_grades: null }).success).toBe(true)
  })
  it('accepts is_all_day = false (partial-day event)', () => {
    const r = createEventSchema.safeParse({ ...validEvent(), is_all_day: false })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.is_all_day).toBe(false)
  })
  it('accepts description as null', () => {
    expect(createEventSchema.safeParse({ ...validEvent(), description: null }).success).toBe(true)
  })

  describe('event_type enum', () => {
    const types = ['class_day', 'holiday', 'exam_period', 'meeting', 'event', 'administrative', 'graduation'] as const
    test.each(types)('accepts event_type "%s"', (event_type) => {
      expect(createEventSchema.safeParse({ ...validEvent(), event_type }).success).toBe(true)
    })
    it('rejects invalid event_type', () => {
      expect(createEventSchema.safeParse({ ...validEvent(), event_type: 'trip' }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// updateEventSchema
// ---------------------------------------------------------------------------
describe('updateEventSchema', () => {
  it('accepts empty object', () => { expect(updateEventSchema.safeParse({}).success).toBe(true) })
  it('accepts title update', () => {
    expect(updateEventSchema.safeParse({ title: 'Cierre Primer Lapso' }).success).toBe(true)
  })
  it('accepts end_date update (rescheduled event)', () => {
    expect(updateEventSchema.safeParse({ end_date: '2025-12-20' }).success).toBe(true)
  })
  it('still rejects invalid event_type in partial update', () => {
    expect(updateEventSchema.safeParse({ event_type: 'trip' }).success).toBe(false)
  })
})
