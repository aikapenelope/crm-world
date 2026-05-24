/**
 * Unit tests — condo_properties validators
 *
 * Venezuelan condo/condominium context:
 *   - aliquot_percent: alícuota — proportional share of common expenses
 *     defined in Documento de Condominio (registered at SUNAVI)
 *   - rif: RIF del condominio (Junta de Condominio) — required for SENIAT
 *   - year_built: coerce from string (form input)
 *   - unit_type 'local': local comercial — commercial unit in mixed building
 *   - unit_type 'parking' / 'storage': puesto de estacionamiento / maletero
 *   - common_areas array of strings: áreas comunes del edificio
 *   - area_type 'social': salón de fiestas, sala de reuniones — reservable
 *   - is_reservable: permite reservas online por los condóminos
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 */

import {
  createBuildingSchema,
  updateBuildingSchema,
  listBuildingsSchema,
  createUnitSchema,
  updateUnitSchema,
  listUnitsSchema,
  createCommonAreaSchema,
  updateCommonAreaSchema,
  listCommonAreasSchema,
} from '../data/validators'

const UUID  = '11111111-1111-4111-8111-111111111111'

const validBuilding = () => ({
  name: 'Residencias Las Palmas', code: 'EDIF-LP-001',
  building_type: 'residential' as const,
})
const validUnit = () => ({
  building_id: UUID, unit_number: '3B',
  unit_type: 'apartment' as const, status: 'occupied' as const,
})
const validArea = () => ({
  building_id: UUID, name: 'Salón de Fiestas',
  area_type: 'social' as const,
})

// ---------------------------------------------------------------------------
// createBuildingSchema
// ---------------------------------------------------------------------------
describe('createBuildingSchema', () => {
  it('accepts minimal building with defaults', () => {
    const r = createBuildingSchema.safeParse(validBuilding())
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.total_units).toBe(0)
      expect(r.data.is_active).toBe(true)
    }
  })
  it('rejects missing code', () => {
    const { code: _o, ...rest } = validBuilding()
    expect(createBuildingSchema.safeParse(rest).success).toBe(false)
  })
  it('rejects year_built below 1900', () => {
    expect(createBuildingSchema.safeParse({ ...validBuilding(), year_built: 1899 }).success).toBe(false)
  })
  it('coerces total_units from string', () => {
    const r = createBuildingSchema.safeParse({ ...validBuilding(), total_units: '24' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.total_units).toBe(24)
  })
  it('accepts rif as null (unregistered junta)', () => {
    expect(createBuildingSchema.safeParse({ ...validBuilding(), rif: null }).success).toBe(true)
  })
  it('accepts common_areas as array of strings', () => {
    const r = createBuildingSchema.safeParse({
      ...validBuilding(), common_areas: ['Piscina', 'Gimnasio'],
    })
    expect(r.success).toBe(true)
  })

  describe('building_type enum', () => {
    const types = ['residential', 'commercial', 'mixed'] as const
    test.each(types)('accepts building_type "%s"', (building_type) => {
      expect(createBuildingSchema.safeParse({ ...validBuilding(), building_type }).success).toBe(true)
    })
    it('rejects invalid building_type', () => {
      expect(createBuildingSchema.safeParse({ ...validBuilding(), building_type: 'industrial' }).success).toBe(false)
    })
  })
})

describe('updateBuildingSchema', () => {
  it('accepts empty object', () => { expect(updateBuildingSchema.safeParse({}).success).toBe(true) })
  it('accepts is_active update', () => {
    expect(updateBuildingSchema.safeParse({ is_active: false }).success).toBe(true)
  })
})

describe('listBuildingsSchema', () => {
  it('accepts empty input with defaults', () => {
    const r = listBuildingsSchema.safeParse({})
    expect(r.success).toBe(true)
    if (r.success) { expect(r.data.page).toBe(1); expect(r.data.pageSize).toBe(50) }
  })
  it('passes through unknown fields', () => {
    expect(listBuildingsSchema.safeParse({ city: 'Caracas' }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// createUnitSchema
// ---------------------------------------------------------------------------
describe('createUnitSchema', () => {
  it('accepts minimal unit with defaults', () => {
    const r = createUnitSchema.safeParse(validUnit())
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.aliquot_percent).toBe('0.00000')
      expect(r.data.parking_spots).toBe(0)
      expect(r.data.storage_units).toBe(0)
    }
  })
  it('rejects non-UUID building_id', () => {
    expect(createUnitSchema.safeParse({ ...validUnit(), building_id: 'bad' }).success).toBe(false)
  })
  it('rejects missing unit_number', () => {
    const { unit_number: _o, ...rest } = validUnit()
    expect(createUnitSchema.safeParse(rest).success).toBe(false)
  })
  it('coerces bedrooms and bathrooms from string', () => {
    const r = createUnitSchema.safeParse({ ...validUnit(), bedrooms: '3', bathrooms: '2' })
    expect(r.success).toBe(true)
    if (r.success) { expect(r.data.bedrooms).toBe(3); expect(r.data.bathrooms).toBe(2) }
  })
  it('accepts owner_id and resident_id as null', () => {
    expect(createUnitSchema.safeParse({ ...validUnit(), owner_id: null, resident_id: null }).success).toBe(true)
  })

  describe('unit_type enum', () => {
    const types = ['apartment', 'penthouse', 'local', 'office', 'parking', 'storage'] as const
    test.each(types)('accepts unit_type "%s"', (unit_type) => {
      expect(createUnitSchema.safeParse({ ...validUnit(), unit_type }).success).toBe(true)
    })
    it('rejects invalid unit_type', () => {
      expect(createUnitSchema.safeParse({ ...validUnit(), unit_type: 'house' }).success).toBe(false)
    })
  })

  describe('status enum', () => {
    const statuses = ['occupied', 'vacant', 'for_sale', 'for_rent'] as const
    test.each(statuses)('accepts status "%s"', (status) => {
      expect(createUnitSchema.safeParse({ ...validUnit(), status }).success).toBe(true)
    })
    it('rejects invalid status', () => {
      expect(createUnitSchema.safeParse({ ...validUnit(), status: 'maintenance' }).success).toBe(false)
    })
  })
})

describe('updateUnitSchema', () => {
  it('accepts empty object', () => { expect(updateUnitSchema.safeParse({}).success).toBe(true) })
  it('accepts status update (vacant → occupied)', () => {
    expect(updateUnitSchema.safeParse({ status: 'vacant' }).success).toBe(true)
  })
})

describe('listUnitsSchema', () => {
  it('accepts empty input with defaults', () => {
    const r = listUnitsSchema.safeParse({})
    expect(r.success).toBe(true)
    if (r.success) { expect(r.data.page).toBe(1); expect(r.data.pageSize).toBe(50) }
  })
  it('accepts building_id UUID filter', () => {
    expect(listUnitsSchema.safeParse({ building_id: UUID }).success).toBe(true)
  })
  it('passes through unknown fields', () => {
    expect(listUnitsSchema.safeParse({ floor: '3' }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// createCommonAreaSchema
// ---------------------------------------------------------------------------
describe('createCommonAreaSchema', () => {
  it('accepts minimal area with defaults', () => {
    const r = createCommonAreaSchema.safeParse(validArea())
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.is_reservable).toBe(false)
      expect(r.data.is_active).toBe(true)
    }
  })
  it('rejects non-UUID building_id', () => {
    expect(createCommonAreaSchema.safeParse({ ...validArea(), building_id: 'bad' }).success).toBe(false)
  })
  it('accepts is_reservable = true with reservation_fee', () => {
    const r = createCommonAreaSchema.safeParse({
      ...validArea(), is_reservable: true, reservation_fee: '50.00',
    })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.is_reservable).toBe(true)
  })
  it('coerces capacity from string', () => {
    const r = createCommonAreaSchema.safeParse({ ...validArea(), capacity: '80' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.capacity).toBe(80)
  })

  describe('area_type enum', () => {
    const types = ['social', 'sports', 'parking', 'garden', 'other'] as const
    test.each(types)('accepts area_type "%s"', (area_type) => {
      expect(createCommonAreaSchema.safeParse({ ...validArea(), area_type }).success).toBe(true)
    })
    it('rejects invalid area_type', () => {
      expect(createCommonAreaSchema.safeParse({ ...validArea(), area_type: 'pool' }).success).toBe(false)
    })
  })
})

describe('updateCommonAreaSchema', () => {
  it('accepts empty object', () => { expect(updateCommonAreaSchema.safeParse({}).success).toBe(true) })
  it('accepts is_active update', () => {
    expect(updateCommonAreaSchema.safeParse({ is_active: false }).success).toBe(true)
  })
})

describe('listCommonAreasSchema', () => {
  it('accepts empty input with defaults', () => {
    const r = listCommonAreasSchema.safeParse({})
    expect(r.success).toBe(true)
    if (r.success) { expect(r.data.page).toBe(1); expect(r.data.pageSize).toBe(50) }
  })
  it('accepts building_id filter', () => {
    expect(listCommonAreasSchema.safeParse({ building_id: UUID }).success).toBe(true)
  })
})
