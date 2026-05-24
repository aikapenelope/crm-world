/**
 * Unit tests — agri_inputs validators
 *
 * Cubre los schemas Zod para el inventario de insumos agropecuarios y los
 * movimientos de stock (entradas, consumos, ajustes, bajas por vencimiento).
 *
 * Contexto venezolano:
 *   - input_type 'medication'/'vaccine': requieren registro INSAI (Instituto
 *     Nacional de Salud Agrícola Integral). Los productos sin registro INSAI
 *     no pueden comercializarse legalmente en Venezuela.
 *   - input_type 'agrochemical': insecticidas, herbicidas, fungicidas.
 *     También requieren autorización INSAI para uso en producción de alimentos.
 *   - expiry_date: crítico porque los medicamentos y vacunas vencidas
 *     provocan pérdidas y riesgo sanitario.
 *   - movement_type 'expiry_write_off': baja obligatoria de insumos vencidos.
 *   - reference_type 'vaccination_record' / 'medication_record': el descuento
 *     del inventario se hace automáticamente al registrar la aplicación.
 *   - quantity_available / min_stock / reorder_quantity: en decimales (3 cifras)
 *     para precisión en dosis (ej: 0.500 litros de vacuna líquida).
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 */

import {
  inputItemCreateSchema,
  inputItemUpdateSchema,
  inputMovementCreateSchema,
  inputMovementUpdateSchema,
} from '../data/validators'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const UUID = '11111111-1111-4111-8111-111111111111'

const validItem = () => ({
  name:       'Amprolium 20 % (coccidiostato)',
  input_type: 'medication' as const,
})

const validMovement = () => ({
  input_item_id:  UUID,
  movement_type:  'purchase_in' as const,
  quantity:       '10.000',
})

// ---------------------------------------------------------------------------
// inputItemCreateSchema
// ---------------------------------------------------------------------------

describe('inputItemCreateSchema', () => {
  describe('required fields', () => {
    it('accepts a minimal valid item with defaults', () => {
      const result = inputItemCreateSchema.safeParse(validItem())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.unit).toBe('units')
        expect(result.data.quantity_available).toBe('0.000')
        expect(result.data.min_stock).toBe('0.000')
        expect(result.data.reorder_quantity).toBe('0.000')
        expect(result.data.is_active).toBe(true)
      }
    })

    it('rejects when name is missing', () => {
      const { name: _omit, ...rest } = validItem()
      expect(inputItemCreateSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when input_type is missing', () => {
      const { input_type: _omit, ...rest } = validItem()
      expect(inputItemCreateSchema.safeParse(rest).success).toBe(false)
    })
  })

  describe('input_type enum', () => {
    const types = ['medication', 'vaccine', 'feed', 'agrochemical', 'material'] as const

    test.each(types)('accepts input_type "%s"', (input_type) => {
      expect(inputItemCreateSchema.safeParse({ ...validItem(), input_type }).success).toBe(true)
    })

    it('rejects invalid input_type', () => {
      expect(inputItemCreateSchema.safeParse({ ...validItem(), input_type: 'equipment' }).success).toBe(false)
    })
  })

  describe('unit enum', () => {
    const units = ['doses', 'ml', 'liters', 'kg', 'g', 'units'] as const

    test.each(units)('accepts unit "%s"', (unit) => {
      expect(inputItemCreateSchema.safeParse({ ...validItem(), unit }).success).toBe(true)
    })

    it('rejects invalid unit', () => {
      expect(inputItemCreateSchema.safeParse({ ...validItem(), unit: 'cc' }).success).toBe(false)
    })
  })

  describe('Venezuelan regulatory fields', () => {
    it('accepts insai_registry for medications and vaccines', () => {
      const result = inputItemCreateSchema.safeParse({
        ...validItem(),
        insai_registry: 'INSAI-MED-2023-0456',
        active_ingredient: 'Amprolium clorhidrato',
        manufacturer: 'Laboratorio Venezolano C.A.',
      })
      expect(result.success).toBe(true)
    })

    it('accepts null insai_registry for materials without regulatory requirement', () => {
      expect(inputItemCreateSchema.safeParse({
        name: 'Bebederos nipple',
        input_type: 'material',
        insai_registry: null,
      }).success).toBe(true)
    })

    it('accepts expiry_date for medications', () => {
      expect(inputItemCreateSchema.safeParse({
        ...validItem(),
        expiry_date: new Date('2027-06-30'),
      }).success).toBe(true)
    })

    it('accepts null expiry_date for materials without expiry', () => {
      expect(inputItemCreateSchema.safeParse({
        ...validItem(),
        expiry_date: null,
      }).success).toBe(true)
    })
  })

  describe('storage temperature fields', () => {
    it('accepts cold-chain storage temperatures for vaccines', () => {
      const result = inputItemCreateSchema.safeParse({
        name: 'Vacuna Newcastle B1 líquida',
        input_type: 'vaccine',
        unit: 'doses',
        storage_temp_min: '2',
        storage_temp_max: '8',
      })
      expect(result.success).toBe(true)
    })

    it('accepts null storage temperatures for ambient storage', () => {
      expect(inputItemCreateSchema.safeParse({
        ...validItem(),
        storage_temp_min: null,
        storage_temp_max: null,
      }).success).toBe(true)
    })
  })

  describe('stock level fields (decimal 3 places)', () => {
    it('accepts decimal quantities for precision dosing', () => {
      const result = inputItemCreateSchema.safeParse({
        ...validItem(),
        unit: 'liters',
        quantity_available: '5.500',
        min_stock: '1.000',
        reorder_quantity: '10.000',
      })
      expect(result.success).toBe(true)
    })
  })
})

// ---------------------------------------------------------------------------
// inputItemUpdateSchema
// ---------------------------------------------------------------------------

describe('inputItemUpdateSchema', () => {
  it('accepts an empty object', () => {
    expect(inputItemUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('accepts deactivating an expired product', () => {
    expect(inputItemUpdateSchema.safeParse({ is_active: false }).success).toBe(true)
  })

  it('still validates input_type enum on partial update', () => {
    expect(inputItemUpdateSchema.safeParse({ input_type: 'equipment' }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// inputMovementCreateSchema
// ---------------------------------------------------------------------------

describe('inputMovementCreateSchema', () => {
  describe('required fields', () => {
    it('accepts a minimal valid movement', () => {
      expect(inputMovementCreateSchema.safeParse(validMovement()).success).toBe(true)
    })

    const required = ['input_item_id', 'movement_type', 'quantity'] as const

    test.each(required)('rejects when %s is missing', (field) => {
      const p = { ...validMovement() }
      delete (p as Record<string, unknown>)[field]
      expect(inputMovementCreateSchema.safeParse(p).success).toBe(false)
    })

    it('rejects non-UUID input_item_id', () => {
      expect(inputMovementCreateSchema.safeParse({ ...validMovement(), input_item_id: 'bad' }).success).toBe(false)
    })
  })

  describe('movement_type enum', () => {
    const types = ['purchase_in', 'consumption', 'adjustment', 'expiry_write_off', 'transfer'] as const

    test.each(types)('accepts movement_type "%s"', (movement_type) => {
      expect(inputMovementCreateSchema.safeParse({ ...validMovement(), movement_type }).success).toBe(true)
    })

    it('rejects invalid movement_type', () => {
      expect(inputMovementCreateSchema.safeParse({ ...validMovement(), movement_type: 'donation' }).success).toBe(false)
    })
  })

  describe('reference tracking — automatic discounts', () => {
    const refTypes = ['vaccination_record', 'medication_record', 'purchase_order', 'manual'] as const

    test.each(refTypes)('accepts reference_type "%s"', (reference_type) => {
      expect(inputMovementCreateSchema.safeParse({
        ...validMovement(),
        movement_type: 'consumption',
        reference_type,
        reference_id: UUID,
      }).success).toBe(true)
    })

    it('rejects invalid reference_type', () => {
      expect(inputMovementCreateSchema.safeParse({
        ...validMovement(),
        reference_type: 'flock',
      }).success).toBe(false)
    })

    it('rejects non-UUID reference_id', () => {
      expect(inputMovementCreateSchema.safeParse({
        ...validMovement(),
        reference_type: 'vaccination_record',
        reference_id: 'not-uuid',
      }).success).toBe(false)
    })

    it('accepts null reference for manual adjustments', () => {
      expect(inputMovementCreateSchema.safeParse({
        ...validMovement(),
        movement_type: 'adjustment',
        reference_type: null,
        reference_id: null,
      }).success).toBe(true)
    })
  })
})

// ---------------------------------------------------------------------------
// inputMovementUpdateSchema
// ---------------------------------------------------------------------------

describe('inputMovementUpdateSchema', () => {
  it('accepts an empty object', () => {
    expect(inputMovementUpdateSchema.safeParse({}).success).toBe(true)
  })
})
