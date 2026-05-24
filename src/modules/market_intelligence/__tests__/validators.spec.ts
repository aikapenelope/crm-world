/**
 * Unit tests — market_intelligence validators
 *
 * Venezuelan real estate market intelligence context:
 *   - valuationRequestSchema: estimación de valor de mercado — para tasación
 *     previa a una transacción inmobiliaria
 *   - comparablesRequestSchema: búsqueda de comparables — propiedades
 *     similares vendidas/alquiladas en la misma zona
 *   - area_m2 coerce min(1): metros cuadrados — mínimo 1 m² para evitar
 *     búsquedas sin sentido
 *   - reference_price coerce min(0): precio de referencia del propietario
 *     (puede ser 0 si no tiene expectativa definida)
 *   - limit default 10 max 20: máximo de comparables retornados (rendimiento
 *     de consultas en mercado venezolano con datos limitados)
 *   - property_id optional UUID: si se conoce el inmueble en sistema
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 */

import {
  valuationRequestSchema,
  comparablesRequestSchema,
} from '../data/validators'

const UUID = '11111111-1111-4111-8111-111111111111'

const validValuation = () => ({
  property_type: 'apartamento',
  operation: 'venta',
  city: 'Caracas',
})

const validComparables = () => ({
  property_type: 'local_comercial',
  operation: 'alquiler',
  city: 'Maracaibo',
})

// ---------------------------------------------------------------------------
// valuationRequestSchema
// ---------------------------------------------------------------------------
describe('valuationRequestSchema', () => {
  it('accepts minimal valuation request', () => {
    expect(valuationRequestSchema.safeParse(validValuation()).success).toBe(true)
  })
  it('rejects missing property_type (min(1))', () => {
    const { property_type: _o, ...rest } = validValuation()
    expect(valuationRequestSchema.safeParse(rest).success).toBe(false)
  })
  it('rejects missing operation (min(1))', () => {
    const { operation: _o, ...rest } = validValuation()
    expect(valuationRequestSchema.safeParse(rest).success).toBe(false)
  })
  it('rejects missing city (min(1))', () => {
    const { city: _o, ...rest } = validValuation()
    expect(valuationRequestSchema.safeParse(rest).success).toBe(false)
  })
  it('accepts zone as null', () => {
    expect(valuationRequestSchema.safeParse({ ...validValuation(), zone: null }).success).toBe(true)
  })
  it('accepts area_m2 as coerced number', () => {
    const r = valuationRequestSchema.safeParse({ ...validValuation(), area_m2: '120' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.area_m2).toBe(120)
  })
  it('rejects area_m2 below 1', () => {
    expect(valuationRequestSchema.safeParse({ ...validValuation(), area_m2: 0 }).success).toBe(false)
  })
  it('accepts bedrooms as coerced number (0 = estudio)', () => {
    const r = valuationRequestSchema.safeParse({ ...validValuation(), bedrooms: '0' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.bedrooms).toBe(0)
  })
  it('accepts reference_price = 0 (sin expectativa)', () => {
    expect(valuationRequestSchema.safeParse({ ...validValuation(), reference_price: 0 }).success).toBe(true)
  })
  it('coerces reference_price from string', () => {
    const r = valuationRequestSchema.safeParse({ ...validValuation(), reference_price: '150000' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.reference_price).toBe(150000)
  })
  it('accepts property_id as UUID', () => {
    expect(valuationRequestSchema.safeParse({ ...validValuation(), property_id: UUID }).success).toBe(true)
  })
  it('accepts property_id as null (external property)', () => {
    expect(valuationRequestSchema.safeParse({ ...validValuation(), property_id: null }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// comparablesRequestSchema
// ---------------------------------------------------------------------------
describe('comparablesRequestSchema', () => {
  it('accepts minimal comparables request with defaults', () => {
    const r = comparablesRequestSchema.safeParse(validComparables())
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.limit).toBe(10)
  })
  it('rejects missing property_type (min(1))', () => {
    const { property_type: _o, ...rest } = validComparables()
    expect(comparablesRequestSchema.safeParse(rest).success).toBe(false)
  })
  it('rejects missing city (min(1))', () => {
    const { city: _o, ...rest } = validComparables()
    expect(comparablesRequestSchema.safeParse(rest).success).toBe(false)
  })
  it('accepts area_m2 and price as coerced numbers', () => {
    const r = comparablesRequestSchema.safeParse({
      ...validComparables(), area_m2: '85', price: '1200',
    })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.area_m2).toBe(85)
      expect(r.data.price).toBe(1200)
    }
  })
  it('rejects area_m2 below 1', () => {
    expect(comparablesRequestSchema.safeParse({ ...validComparables(), area_m2: 0 }).success).toBe(false)
  })
  it('rejects price below 0', () => {
    expect(comparablesRequestSchema.safeParse({ ...validComparables(), price: -1 }).success).toBe(false)
  })
  it('rejects limit below 1', () => {
    expect(comparablesRequestSchema.safeParse({ ...validComparables(), limit: 0 }).success).toBe(false)
  })
  it('rejects limit above 20', () => {
    expect(comparablesRequestSchema.safeParse({ ...validComparables(), limit: 21 }).success).toBe(false)
  })
  it('coerces limit from string', () => {
    const r = comparablesRequestSchema.safeParse({ ...validComparables(), limit: '5' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.limit).toBe(5)
  })
})
