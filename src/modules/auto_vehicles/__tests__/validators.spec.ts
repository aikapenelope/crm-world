/**
 * Unit tests — auto_vehicles validators
 *
 * Venezuelan automotive context:
 *   - plate: placa venezolana formato ABC-123 (aunque no hay validación de
 *     formato específico — solo min(1) max(15))
 *   - engine_type 'gas': vehículos a gas natural — muy comunes en Venezuela
 *     por el subsidio histórico del gas (GNV); estaciones en toda Venezuela
 *   - year coerce min(1950) max(2030)
 *   - current_km coerce min(0) default 0
 *   - photo_url min(1): NO testear rechazo de '' (§14 no aplica — usa min(1))
 *     PERO photo_url sí tiene min(1) en createPhotoSchema — SÍ rechaza ''
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 */

import {
  createVehicleSchema,
  updateVehicleSchema,
  createPhotoSchema,
  listVehiclesSchema,
} from '../data/validators'

const UUID  = '11111111-1111-4111-8111-111111111111'
const UUID2 = '22222222-2222-4222-8222-222222222222'

const validVehicle = () => ({
  customer_id: UUID,
  plate: 'ABC-123',
  brand: 'Toyota',
  model: 'Corolla',
  year: 2018,
})

const validPhoto = () => ({
  vehicle_id: UUID,
  photo_url: 'https://cdn.example.com/abc123.jpg',
})

// ---------------------------------------------------------------------------
// createVehicleSchema
// ---------------------------------------------------------------------------
describe('createVehicleSchema', () => {
  describe('required fields and defaults', () => {
    it('accepts minimal vehicle with defaults', () => {
      const r = createVehicleSchema.safeParse(validVehicle())
      expect(r.success).toBe(true)
      if (r.success) {
        expect(r.data.engine_type).toBe('gasoline')
        expect(r.data.transmission).toBe('manual')
        expect(r.data.current_km).toBe(0)
      }
    })
    it('rejects non-UUID customer_id', () => {
      expect(createVehicleSchema.safeParse({ ...validVehicle(), customer_id: 'bad' }).success).toBe(false)
    })
    it('rejects missing plate', () => {
      const { plate: _o, ...rest } = validVehicle()
      expect(createVehicleSchema.safeParse(rest).success).toBe(false)
    })
    it('rejects year below 1950', () => {
      expect(createVehicleSchema.safeParse({ ...validVehicle(), year: 1949 }).success).toBe(false)
    })
    it('rejects year above 2030', () => {
      expect(createVehicleSchema.safeParse({ ...validVehicle(), year: 2031 }).success).toBe(false)
    })
    it('coerces year from string', () => {
      const r = createVehicleSchema.safeParse({ ...validVehicle(), year: '2018' })
      expect(r.success).toBe(true)
      if (r.success) expect(r.data.year).toBe(2018)
    })
    it('rejects current_km below 0', () => {
      expect(createVehicleSchema.safeParse({ ...validVehicle(), current_km: -1 }).success).toBe(false)
    })
    it('coerces current_km from string', () => {
      const r = createVehicleSchema.safeParse({ ...validVehicle(), current_km: '85000' })
      expect(r.success).toBe(true)
      if (r.success) expect(r.data.current_km).toBe(85000)
    })
    it('accepts color, vin, notes as null', () => {
      expect(createVehicleSchema.safeParse({ ...validVehicle(), color: null, vin: null, notes: null }).success).toBe(true)
    })
  })

  describe('engine_type enum', () => {
    const types = ['gasoline', 'diesel', 'hybrid', 'electric', 'gas'] as const
    test.each(types)('accepts engine_type "%s"', (engine_type) => {
      expect(createVehicleSchema.safeParse({ ...validVehicle(), engine_type }).success).toBe(true)
    })
    it('rejects invalid engine_type', () => {
      expect(createVehicleSchema.safeParse({ ...validVehicle(), engine_type: 'hydrogen' }).success).toBe(false)
    })
  })

  describe('transmission enum', () => {
    const types = ['manual', 'automatic'] as const
    test.each(types)('accepts transmission "%s"', (transmission) => {
      expect(createVehicleSchema.safeParse({ ...validVehicle(), transmission }).success).toBe(true)
    })
    it('rejects invalid transmission', () => {
      expect(createVehicleSchema.safeParse({ ...validVehicle(), transmission: 'cvt' }).success).toBe(false)
    })
  })
})

describe('updateVehicleSchema', () => {
  it('accepts empty object', () => { expect(updateVehicleSchema.safeParse({}).success).toBe(true) })
  it('accepts current_km update (odometer reading)', () => {
    expect(updateVehicleSchema.safeParse({ current_km: 92000 }).success).toBe(true)
  })
  it('still rejects invalid engine_type in partial update', () => {
    expect(updateVehicleSchema.safeParse({ engine_type: 'hydrogen' }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// createPhotoSchema
// ---------------------------------------------------------------------------
describe('createPhotoSchema', () => {
  it('accepts minimal photo with defaults', () => {
    const r = createPhotoSchema.safeParse(validPhoto())
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.photo_type).toBe('other')
  })
  it('rejects non-UUID vehicle_id', () => {
    expect(createPhotoSchema.safeParse({ ...validPhoto(), vehicle_id: 'bad' }).success).toBe(false)
  })
  it('rejects empty photo_url (min(1) — § 14 aplica)', () => {
    // photo_url usa z.string().min(1) → '' es rechazado
    expect(createPhotoSchema.safeParse({ ...validPhoto(), photo_url: '' }).success).toBe(false)
  })
  it('accepts caption as null', () => {
    expect(createPhotoSchema.safeParse({ ...validPhoto(), caption: null }).success).toBe(true)
  })

  describe('photo_type enum', () => {
    const types = ['front', 'rear', 'left', 'right', 'interior', 'engine', 'damage', 'other'] as const
    test.each(types)('accepts photo_type "%s"', (photo_type) => {
      expect(createPhotoSchema.safeParse({ ...validPhoto(), photo_type }).success).toBe(true)
    })
    it('rejects invalid photo_type', () => {
      expect(createPhotoSchema.safeParse({ ...validPhoto(), photo_type: 'trunk' }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// listVehiclesSchema
// ---------------------------------------------------------------------------
describe('listVehiclesSchema', () => {
  it('accepts empty input with defaults', () => {
    const r = listVehiclesSchema.safeParse({})
    expect(r.success).toBe(true)
    if (r.success) { expect(r.data.page).toBe(1); expect(r.data.pageSize).toBe(50) }
  })
  it('coerces page from string', () => {
    const r = listVehiclesSchema.safeParse({ page: '2' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.page).toBe(2)
  })
  it('accepts customer_id UUID filter', () => {
    expect(listVehiclesSchema.safeParse({ customer_id: UUID }).success).toBe(true)
  })
  it('passes through unknown fields', () => {
    expect(listVehiclesSchema.safeParse({ brand: 'Toyota' }).success).toBe(true)
  })
})
