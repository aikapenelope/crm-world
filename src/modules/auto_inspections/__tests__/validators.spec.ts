/**
 * Unit tests — auto_inspections validators
 *
 * Venezuelan automotive inspection context:
 *   - system_category 13 valores: inspección integral del vehículo
 *   - type 'intake': inspección de entrada — documenta estado al recibir
 *   - type 'completion': inspección de salida — documenta trabajo realizado
 *   - urgency 'immediate': acción requerida antes de entregar el vehículo
 *   - photo_type 'finding': hallazgo fotográfico — daño o desgaste
 *   - annotations_json: z.any() — acepta cualquier valor (coordenadas de
 *     anotaciones en foto; formato libre según herramienta)
 *   - updateInspectionSchema: schema STANDALONE (no partial de create)
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 */

import {
  createInspectionSchema,
  updateInspectionSchema,
  createInspectionItemSchema,
  createInspectionPhotoSchema,
  listInspectionsSchema,
} from '../data/validators'

const UUID  = '11111111-1111-4111-8111-111111111111'
const UUID2 = '22222222-2222-4222-8222-222222222222'

const validInspection = () => ({
  service_order_id: UUID,
  vehicle_id: UUID2,
})

const validItem = () => ({
  inspection_id: UUID,
  system_category: 'brakes' as const,
  item_name: 'Pastillas de freno delantera',
})

const validPhoto = () => ({
  inspection_id: UUID,
  photo_url: 'https://cdn.example.com/photo.jpg',
})

// ---------------------------------------------------------------------------
// createInspectionSchema
// ---------------------------------------------------------------------------
describe('createInspectionSchema', () => {
  it('accepts minimal inspection with defaults', () => {
    const r = createInspectionSchema.safeParse(validInspection())
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.type).toBe('intake')
  })
  it('rejects non-UUID service_order_id', () => {
    expect(createInspectionSchema.safeParse({ ...validInspection(), service_order_id: 'bad' }).success).toBe(false)
  })
  it('accepts overall_condition as null (no general assessment yet)', () => {
    expect(createInspectionSchema.safeParse({ ...validInspection(), overall_condition: null }).success).toBe(true)
  })
  it('accepts inspector_id as null', () => {
    expect(createInspectionSchema.safeParse({ ...validInspection(), inspector_id: null }).success).toBe(true)
  })

  describe('type enum', () => {
    const types = ['intake', 'diagnosis', 'progress', 'completion'] as const
    test.each(types)('accepts type "%s"', (type) => {
      expect(createInspectionSchema.safeParse({ ...validInspection(), type }).success).toBe(true)
    })
    it('rejects invalid type', () => {
      expect(createInspectionSchema.safeParse({ ...validInspection(), type: 'exit' }).success).toBe(false)
    })
  })

  describe('overall_condition enum', () => {
    const conditions = ['good', 'fair', 'needs_attention', 'critical'] as const
    test.each(conditions)('accepts overall_condition "%s"', (overall_condition) => {
      expect(createInspectionSchema.safeParse({ ...validInspection(), overall_condition }).success).toBe(true)
    })
  })
})

// ---------------------------------------------------------------------------
// updateInspectionSchema — standalone
// ---------------------------------------------------------------------------
describe('updateInspectionSchema', () => {
  it('accepts empty object', () => { expect(updateInspectionSchema.safeParse({}).success).toBe(true) })

  describe('status enum', () => {
    const statuses = ['in_progress', 'completed', 'sent_to_customer'] as const
    test.each(statuses)('accepts status "%s"', (status) => {
      expect(updateInspectionSchema.safeParse({ status }).success).toBe(true)
    })
    it('rejects invalid status', () => {
      expect(updateInspectionSchema.safeParse({ status: 'approved' }).success).toBe(false)
    })
  })
  it('accepts overall_condition as null', () => {
    expect(updateInspectionSchema.safeParse({ overall_condition: null }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// createInspectionItemSchema
// ---------------------------------------------------------------------------
describe('createInspectionItemSchema', () => {
  it('accepts minimal item with defaults', () => {
    const r = createInspectionItemSchema.safeParse(validItem())
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.condition).toBe('not_inspected')
      expect(r.data.urgency).toBe('none')
    }
  })
  it('rejects non-UUID inspection_id', () => {
    expect(createInspectionItemSchema.safeParse({ ...validItem(), inspection_id: 'bad' }).success).toBe(false)
  })
  it('rejects empty item_name (min(1))', () => {
    expect(createInspectionItemSchema.safeParse({ ...validItem(), item_name: '' }).success).toBe(false)
  })

  describe('system_category enum (13 values)', () => {
    const cats = [
      'brakes', 'engine', 'suspension', 'electrical', 'tires', 'fluids',
      'body', 'interior', 'exhaust', 'transmission', 'cooling', 'steering', 'other',
    ] as const
    test.each(cats)('accepts system_category "%s"', (system_category) => {
      expect(createInspectionItemSchema.safeParse({ ...validItem(), system_category }).success).toBe(true)
    })
    it('rejects invalid system_category', () => {
      expect(createInspectionItemSchema.safeParse({ ...validItem(), system_category: 'hvac' }).success).toBe(false)
    })
  })

  describe('condition enum', () => {
    const conditions = ['good', 'fair', 'needs_attention', 'critical', 'not_inspected'] as const
    test.each(conditions)('accepts condition "%s"', (condition) => {
      expect(createInspectionItemSchema.safeParse({ ...validItem(), condition }).success).toBe(true)
    })
  })

  describe('urgency enum', () => {
    const urgencies = ['none', 'soon', 'immediate'] as const
    test.each(urgencies)('accepts urgency "%s"', (urgency) => {
      expect(createInspectionItemSchema.safeParse({ ...validItem(), urgency }).success).toBe(true)
    })
    it('rejects invalid urgency', () => {
      expect(createInspectionItemSchema.safeParse({ ...validItem(), urgency: 'critical' }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// createInspectionPhotoSchema
// ---------------------------------------------------------------------------
describe('createInspectionPhotoSchema', () => {
  it('accepts minimal photo with defaults', () => {
    const r = createInspectionPhotoSchema.safeParse(validPhoto())
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.photo_type).toBe('finding')
  })
  it('rejects empty photo_url (min(1))', () => {
    expect(createInspectionPhotoSchema.safeParse({ ...validPhoto(), photo_url: '' }).success).toBe(false)
  })
  it('accepts inspection_item_id as null (general photo)', () => {
    expect(createInspectionPhotoSchema.safeParse({ ...validPhoto(), inspection_item_id: null }).success).toBe(true)
  })
  it('accepts annotations_json as any value (coordinates object)', () => {
    expect(createInspectionPhotoSchema.safeParse({
      ...validPhoto(), annotations_json: { x: 120, y: 80, label: 'desgaste' },
    }).success).toBe(true)
  })
  it('accepts annotations_json as null', () => {
    expect(createInspectionPhotoSchema.safeParse({ ...validPhoto(), annotations_json: null }).success).toBe(true)
  })

  describe('photo_type enum', () => {
    const types = ['before', 'during', 'after', 'finding'] as const
    test.each(types)('accepts photo_type "%s"', (photo_type) => {
      expect(createInspectionPhotoSchema.safeParse({ ...validPhoto(), photo_type }).success).toBe(true)
    })
    it('rejects invalid photo_type', () => {
      expect(createInspectionPhotoSchema.safeParse({ ...validPhoto(), photo_type: 'exterior' }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// listInspectionsSchema
// ---------------------------------------------------------------------------
describe('listInspectionsSchema', () => {
  it('accepts empty input with defaults', () => {
    const r = listInspectionsSchema.safeParse({})
    expect(r.success).toBe(true)
    if (r.success) { expect(r.data.page).toBe(1); expect(r.data.pageSize).toBe(50) }
  })
  it('accepts UUID filters', () => {
    expect(listInspectionsSchema.safeParse({ service_order_id: UUID, vehicle_id: UUID2 }).success).toBe(true)
  })
  it('passes through unknown fields', () => {
    expect(listInspectionsSchema.safeParse({ date_from: '2026-01-01' }).success).toBe(true)
  })
})
