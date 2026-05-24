/**
 * Unit tests — mfg_inventory validators
 *
 * Covers the Zod schemas for warehouse locations, stock lots, stock movements,
 * and cycle counts used in the Manufacturing Inventory vertical.
 *
 * Venezuelan manufacturing inventory context:
 *   - Materials split into raw_material, packaging, wip, finished_goods
 *   - Lot status starts as 'quarantine' until QC approves (SENASAG-style traceability)
 *   - Movement types include CORPOELEC-related expired_writeoff (spoilage during cuts)
 *   - Cycle counts require supervisor approval (pending_approval → approved)
 *   - cost fields in USD due to Venezuela's dual-currency environment (BCV rate)
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 *
 * Reference: https://docs.open-mercato.dev/framework/api/api-development-guide
 * Spec: .ai/specs/ (Phase 24 — Manufactura Industrial)
 */

import {
  warehouseLocationCreateSchema,
  warehouseLocationUpdateSchema,
  stockLotCreateSchema,
  stockLotUpdateSchema,
  stockMovementCreateSchema,
  cycleCountCreateSchema,
  cycleCountUpdateSchema,
} from '../data/validators'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const UUID = '11111111-1111-4111-8111-111111111111'
const UUID2 = '22222222-2222-4222-8222-222222222222'

/** Minimal valid warehouse location payload. */
const validLocation = () => ({
  code: 'ALM-MP-01',
  name: 'Almacén Materia Prima 1',
})

/** Minimal valid stock lot payload. */
const validLot = () => ({
  material_id: UUID,
  material_code: 'MP-HARINA-001',
  material_name: 'Harina de trigo todo uso',
  lot_number: 'LOTE-2026-001',
  quantity: '5000.00',
  uom: 'KG',
  entry_date: new Date('2026-01-15T08:00:00Z'),
})

/** Minimal valid stock movement payload. */
const validMovement = () => ({
  lot_id: UUID,
  movement_type: 'GR_purchase' as const,
  quantity: '500.00',
})

/** Minimal valid cycle count payload. */
const validCycleCount = () => ({
  count_number: 'CC-2026-001',
  scheduled_date: new Date('2026-02-01T06:00:00Z'),
})

// ---------------------------------------------------------------------------
// warehouseLocationCreateSchema
// ---------------------------------------------------------------------------

describe('warehouseLocationCreateSchema', () => {
  describe('required fields and defaults', () => {
    it('accepts a minimal valid location with defaults', () => {
      const result = warehouseLocationCreateSchema.safeParse(validLocation())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.warehouse_type).toBe('raw_material')
        expect(result.data.storage_conditions).toBe('ambient')
        expect(result.data.is_active).toBe(true)
      }
    })

    it('rejects when code is missing', () => {
      const { code: _omit, ...rest } = validLocation()
      expect(warehouseLocationCreateSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when name is missing', () => {
      const { name: _omit, ...rest } = validLocation()
      expect(warehouseLocationCreateSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects code longer than 30 chars', () => {
      expect(
        warehouseLocationCreateSchema.safeParse({ ...validLocation(), code: 'X'.repeat(31) }).success
      ).toBe(false)
    })

    it('accepts capacity_kg as null (no capacity tracking)', () => {
      expect(
        warehouseLocationCreateSchema.safeParse({ ...validLocation(), capacity_kg: null }).success
      ).toBe(true)
    })
  })

  describe('warehouse_type enum', () => {
    const types = [
      'raw_material',
      'packaging',
      'wip',
      'finished_goods',
      'spare_parts',
      'quarantine',
      'rejected',
    ] as const

    test.each(types)('accepts warehouse_type "%s"', (warehouse_type) => {
      expect(
        warehouseLocationCreateSchema.safeParse({ ...validLocation(), warehouse_type }).success
      ).toBe(true)
    })

    it('rejects an invalid warehouse_type', () => {
      expect(
        warehouseLocationCreateSchema.safeParse({ ...validLocation(), warehouse_type: 'archive' }).success
      ).toBe(false)
    })
  })

  describe('storage_conditions enum', () => {
    const conditions = ['ambient', 'refrigerated', 'frozen', 'controlled_humidity'] as const

    test.each(conditions)('accepts storage_conditions "%s"', (storage_conditions) => {
      expect(
        warehouseLocationCreateSchema.safeParse({ ...validLocation(), storage_conditions }).success
      ).toBe(true)
    })

    it('rejects an invalid storage_conditions', () => {
      expect(
        warehouseLocationCreateSchema.safeParse({ ...validLocation(), storage_conditions: 'outdoor' }).success
      ).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// warehouseLocationUpdateSchema
// ---------------------------------------------------------------------------

describe('warehouseLocationUpdateSchema', () => {
  it('accepts an empty object', () => {
    expect(warehouseLocationUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('accepts a partial update with only is_active', () => {
    expect(
      warehouseLocationUpdateSchema.safeParse({ is_active: false }).success
    ).toBe(true)
  })

  it('still rejects invalid warehouse_type in partial update', () => {
    expect(
      warehouseLocationUpdateSchema.safeParse({ warehouse_type: 'archive' }).success
    ).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// stockLotCreateSchema
// ---------------------------------------------------------------------------

describe('stockLotCreateSchema', () => {
  describe('required fields and defaults', () => {
    it('accepts a minimal valid lot with defaults', () => {
      const result = stockLotCreateSchema.safeParse(validLot())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.material_type).toBe('raw_material')
        expect(result.data.status).toBe('quarantine')
      }
    })

    it('rejects when material_id is not a UUID', () => {
      expect(stockLotCreateSchema.safeParse({ ...validLot(), material_id: 'bad-id' }).success).toBe(false)
    })

    it('rejects when lot_number is missing', () => {
      const { lot_number: _omit, ...rest } = validLot()
      expect(stockLotCreateSchema.safeParse(rest).success).toBe(false)
    })

    it('accepts entry_date as an ISO string (coerced to Date)', () => {
      const result = stockLotCreateSchema.safeParse({
        ...validLot(),
        entry_date: '2026-01-15T08:00:00Z',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.entry_date).toBeInstanceOf(Date)
      }
    })

    it('accepts expiry_date as null (no expiration)', () => {
      expect(stockLotCreateSchema.safeParse({ ...validLot(), expiry_date: null }).success).toBe(true)
    })

    it('accepts expiry_date as ISO string (coerced to Date)', () => {
      const result = stockLotCreateSchema.safeParse({
        ...validLot(),
        expiry_date: '2026-12-31T00:00:00Z',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.expiry_date).toBeInstanceOf(Date)
      }
    })

    it('accepts unit_cost_usd as null (cost unknown at entry)', () => {
      expect(stockLotCreateSchema.safeParse({ ...validLot(), unit_cost_usd: null }).success).toBe(true)
    })
  })

  describe('material_type enum', () => {
    const types = ['raw_material', 'packaging', 'wip', 'finished_goods'] as const

    test.each(types)('accepts material_type "%s"', (material_type) => {
      expect(stockLotCreateSchema.safeParse({ ...validLot(), material_type }).success).toBe(true)
    })

    it('rejects an invalid material_type', () => {
      expect(stockLotCreateSchema.safeParse({ ...validLot(), material_type: 'spare_parts' }).success).toBe(false)
    })
  })

  describe('status enum — Venezuelan lot lifecycle', () => {
    // Lots start as quarantine (hold) until QC inspection approves
    const statuses = ['quarantine', 'available', 'reserved', 'consumed', 'expired', 'rejected'] as const

    test.each(statuses)('accepts status "%s"', (status) => {
      expect(stockLotCreateSchema.safeParse({ ...validLot(), status }).success).toBe(true)
    })

    it('rejects an invalid lot status', () => {
      expect(stockLotCreateSchema.safeParse({ ...validLot(), status: 'on_hold' }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// stockLotUpdateSchema
// ---------------------------------------------------------------------------

describe('stockLotUpdateSchema', () => {
  it('accepts an empty object', () => {
    expect(stockLotUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('accepts a status-only update (quarantine → available after QC)', () => {
    expect(stockLotUpdateSchema.safeParse({ status: 'available' }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// stockMovementCreateSchema
// ---------------------------------------------------------------------------

describe('stockMovementCreateSchema', () => {
  describe('required fields', () => {
    it('accepts a minimal valid movement', () => {
      expect(stockMovementCreateSchema.safeParse(validMovement()).success).toBe(true)
    })

    it('rejects when lot_id is not a UUID', () => {
      expect(stockMovementCreateSchema.safeParse({ ...validMovement(), lot_id: 'bad' }).success).toBe(false)
    })

    it('accepts from_location_id and to_location_id as null (no location tracking)', () => {
      expect(
        stockMovementCreateSchema.safeParse({
          ...validMovement(),
          from_location_id: null,
          to_location_id: null,
        }).success
      ).toBe(true)
    })
  })

  describe('movement_type enum', () => {
    const movementTypes = [
      'GR_purchase',
      'GR_production',
      'GI_production',
      'GI_scrap',
      'transfer',
      'adjustment',
      'count_adjustment',
      'quarantine_hold',
      'quarantine_release',
      'expired_writeoff',
    ] as const

    test.each(movementTypes)('accepts movement_type "%s"', (movement_type) => {
      expect(stockMovementCreateSchema.safeParse({ ...validMovement(), movement_type }).success).toBe(true)
    })

    it('rejects an invalid movement_type', () => {
      expect(
        stockMovementCreateSchema.safeParse({ ...validMovement(), movement_type: 'return' }).success
      ).toBe(false)
    })
  })

  describe('reference_type enum', () => {
    const refTypes = [
      'production_order',
      'purchase_order',
      'quality_inspection',
      'cycle_count',
      'manual',
    ] as const

    test.each(refTypes)('accepts reference_type "%s"', (reference_type) => {
      expect(
        stockMovementCreateSchema.safeParse({
          ...validMovement(),
          reference_type,
          reference_id: UUID,
        }).success
      ).toBe(true)
    })

    it('accepts reference_type as null (unlinked movement)', () => {
      expect(
        stockMovementCreateSchema.safeParse({ ...validMovement(), reference_type: null }).success
      ).toBe(true)
    })

    it('rejects an invalid reference_type', () => {
      expect(
        stockMovementCreateSchema.safeParse({ ...validMovement(), reference_type: 'sales_order' }).success
      ).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// cycleCountCreateSchema
// ---------------------------------------------------------------------------

describe('cycleCountCreateSchema', () => {
  describe('required fields and defaults', () => {
    it('accepts a minimal valid cycle count with defaults', () => {
      const result = cycleCountCreateSchema.safeParse(validCycleCount())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('planned')
      }
    })

    it('rejects when count_number is missing', () => {
      const { count_number: _omit, ...rest } = validCycleCount()
      expect(cycleCountCreateSchema.safeParse(rest).success).toBe(false)
    })

    it('accepts scheduled_date as an ISO string (coerced to Date)', () => {
      const result = cycleCountCreateSchema.safeParse({
        ...validCycleCount(),
        scheduled_date: '2026-02-01T06:00:00Z',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.scheduled_date).toBeInstanceOf(Date)
      }
    })

    it('accepts location_id as null (full warehouse count)', () => {
      expect(
        cycleCountCreateSchema.safeParse({ ...validCycleCount(), location_id: null }).success
      ).toBe(true)
    })
  })

  describe('status enum', () => {
    const statuses = ['planned', 'in_progress', 'pending_approval', 'approved', 'cancelled'] as const

    test.each(statuses)('accepts status "%s"', (status) => {
      expect(cycleCountCreateSchema.safeParse({ ...validCycleCount(), status }).success).toBe(true)
    })

    it('rejects an invalid status', () => {
      expect(cycleCountCreateSchema.safeParse({ ...validCycleCount(), status: 'draft' }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// cycleCountUpdateSchema
// ---------------------------------------------------------------------------

describe('cycleCountUpdateSchema', () => {
  it('accepts an empty object', () => {
    expect(cycleCountUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('accepts a status-only update (pending_approval → approved)', () => {
    expect(cycleCountUpdateSchema.safeParse({ status: 'approved' }).success).toBe(true)
  })
})
