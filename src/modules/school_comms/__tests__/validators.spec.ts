/**
 * Unit tests — school_comms validators
 *
 * Venezuelan school communications context:
 *   - announcement_type 'circular': circular escolar — comunicado oficial
 *     del plantel; en Venezuela se entrega impreso y por WhatsApp
 *   - announcement_type 'emergency': comunicado de emergencia — CORPOELEC
 *     power cut, insecurity event, flooding, or epidemic closure
 *   - target_audience 'grade_specific': por grado — common for exam notices,
 *     graduation ceremonies, or lapso-specific communications
 *   - target_audience 'section_specific': por sección — profesor-nivel
 *     communication (actividades específicas de sección)
 *   - target_grades: array of grade_level strings (MPPE nomenclature)
 *   - expires_at: circulares tienen vencimiento — desaparecen del tablón
 *     de anuncios digital después de la fecha
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 */

import {
  createAnnouncementSchema,
  updateAnnouncementSchema,
} from '../data/validators'

const validAnnouncement = () => ({
  title: 'Aviso de cobro: Mensualidad Enero 2026',
  body: 'Se recuerda a los representantes que el vencimiento de la mensualidad de enero es el día 5.',
  announcement_type: 'notice' as const,
})

// ---------------------------------------------------------------------------
// createAnnouncementSchema
// ---------------------------------------------------------------------------
describe('createAnnouncementSchema', () => {
  it('accepts minimal announcement with defaults', () => {
    const r = createAnnouncementSchema.safeParse(validAnnouncement())
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.target_audience).toBe('all')
  })
  it('rejects empty title', () => {
    expect(createAnnouncementSchema.safeParse({ ...validAnnouncement(), title: '' }).success).toBe(false)
  })
  it('rejects empty body', () => {
    expect(createAnnouncementSchema.safeParse({ ...validAnnouncement(), body: '' }).success).toBe(false)
  })
  it('accepts expires_at as plain string', () => {
    const r = createAnnouncementSchema.safeParse({ ...validAnnouncement(), expires_at: '2026-01-31' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.expires_at).toBe('2026-01-31')
  })
  it('accepts expires_at as null (permanent announcement)', () => {
    expect(createAnnouncementSchema.safeParse({ ...validAnnouncement(), expires_at: null }).success).toBe(true)
  })
  it('accepts target_grades array for grade_specific audience', () => {
    const r = createAnnouncementSchema.safeParse({
      ...validAnnouncement(),
      target_audience: 'grade_specific',
      target_grades: ['bachillerato_4', 'bachillerato_5'],
    })
    expect(r.success).toBe(true)
  })
  it('accepts target_grades as null (all grades)', () => {
    expect(createAnnouncementSchema.safeParse({ ...validAnnouncement(), target_grades: null }).success).toBe(true)
  })
  it('accepts target_sections array for section_specific audience', () => {
    const r = createAnnouncementSchema.safeParse({
      ...validAnnouncement(),
      target_audience: 'section_specific',
      target_sections: ['A', 'B'],
    })
    expect(r.success).toBe(true)
  })
  it('accepts target_sections as null', () => {
    expect(createAnnouncementSchema.safeParse({ ...validAnnouncement(), target_sections: null }).success).toBe(true)
  })

  describe('announcement_type enum', () => {
    const types = ['circular', 'notice', 'reminder', 'emergency'] as const
    test.each(types)('accepts announcement_type "%s"', (announcement_type) => {
      expect(createAnnouncementSchema.safeParse({ ...validAnnouncement(), announcement_type }).success).toBe(true)
    })
    it('rejects invalid announcement_type', () => {
      expect(createAnnouncementSchema.safeParse({ ...validAnnouncement(), announcement_type: 'alert' }).success).toBe(false)
    })
  })

  describe('target_audience enum', () => {
    const audiences = ['all', 'grade_specific', 'section_specific'] as const
    test.each(audiences)('accepts target_audience "%s"', (target_audience) => {
      expect(createAnnouncementSchema.safeParse({ ...validAnnouncement(), target_audience }).success).toBe(true)
    })
    it('rejects invalid target_audience', () => {
      expect(createAnnouncementSchema.safeParse({ ...validAnnouncement(), target_audience: 'class_specific' }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// updateAnnouncementSchema
// ---------------------------------------------------------------------------
describe('updateAnnouncementSchema', () => {
  it('accepts empty object', () => { expect(updateAnnouncementSchema.safeParse({}).success).toBe(true) })
  it('accepts body update (correction)', () => {
    expect(updateAnnouncementSchema.safeParse({ body: 'Corrección: el vencimiento es el día 7.' }).success).toBe(true)
  })
  it('accepts expires_at update (extending validity)', () => {
    expect(updateAnnouncementSchema.safeParse({ expires_at: '2026-02-28' }).success).toBe(true)
  })
  it('still rejects invalid announcement_type in partial update', () => {
    expect(updateAnnouncementSchema.safeParse({ announcement_type: 'alert' }).success).toBe(false)
  })
})
