/**
 * Unit tests — mfg_subcontract validators
 *
 * Covers the Zod schemas for subcontract orders and subcontract materials used
 * in the Manufacturing Subcontracting vertical.
 *
 * Venezuelan manufacturing subcontracting context:
 *   - Subcontracting (maquila) is common for processing operations: packaging,
 *     cutting, mixing, or finishing steps performed by third-party contractors
 *   - Materials are sent to subcontractor and finished goods returned — material
 *     traceability (lot_id / lot_number) is required for SENASAG compliance
 *   - price_per_unit_usd: maquila fee always in USD (forex stability for contracts)
 *   - standard_scrap_pct: expected material loss during external processing
 *     (used for inventory variance reconciliation)
 *   - status 'materials_sent': subcontractor has received raw materials but
 *     has not yet started production (Venezuelan logistics delays common)
 *   - quantity_expected_back: calculated from quantity_sent and standard_scrap_pct
 *     for receiving reconciliation
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 *
 * Reference: https://docs.open-mercato.dev/framework/api/api-development-guide
 * Spec: .ai/specs/ (Phase 24 — Manufactura Industrial)
 */

import {
  subcontractOrderCreateSchema,
  subcontractOrderUpdateSchema,
  subcontractMaterialCreateSchema,
  subcontractMaterialUpdateSchema,
} from '../data/validators'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const UUID = '11111111-1111-4111-8111-111111111111'
const UUID2 = '22222222-2222-4222-8222-222222222222'

/** Minimal valid subcontract order payload. */
const validOrder = () => ({
  order_number: 'SC-2026-001',
  subcontractor_name: 'Envases y Empaques C.A.',
  product_id: UUID,
  product_code: 'PT-001',
  product_name: 'Galletas de soda 500g (empacadas)',
  quantity_ordered: '50000',
  uom: 'UNID',
  price_per_unit_usd: '0.12',
})

/** Minimal valid subcontract material payload. */
const validMaterial = () => ({
  subcontract_order_id: UUID,
  material_id: UUID2,
  material_code: 'MP-ENV-001',
  material_name: 'Envase PET 500ml',
  quantity_sent: '52000',
  uom: 'UNID',
})

// ---------------------------------------------------------------------------
// subcontractOrderCreateSchema
// ---------------------------------------------------------------------------

describe('subcontractOrderCreateSchema', () => {
  describe('required fields and defaults', () => {
    it('accepts a minimal valid subcontract order with defaults', () => {
      const result = subcontractOrderCreateSchema.safeParse(validOrder())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('draft')
        expect(result.data.standard_scrap_pct).toBe('0.00')
      }
    })

    it('rejects when order_number is missing', () => {
      const { order_number: _omit, ...rest } = validOrder()
      expect(subcontractOrderCreateSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when subcontractor_name is missing', () => {
      const { subcontractor_name: _omit, ...rest } = validOrder()
      expect(subcontractOrderCreateSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when product_id is not a UUID', () => {
      expect(subcontractOrderCreateSchema.safeParse({ ...validOrder(), product_id: 'bad' }).success).toBe(false)
    })

    it('rejects when product_code is missing', () => {
      const { product_code: _omit, ...rest } = validOrder()
      expect(subcontractOrderCreateSchema.safeParse(rest).success).toBe(false)
    })

    it('accepts subcontractor_id as null (informal contractor — no system record)', () => {
      expect(
        subcontractOrderCreateSchema.safeParse({ ...validOrder(), subcontractor_id: null }).success
      ).toBe(true)
    })

    it('accepts subcontractor_id as a UUID', () => {
      expect(
        subcontractOrderCreateSchema.safeParse({ ...validOrder(), subcontractor_id: UUID2 }).success
      ).toBe(true)
    })

    it('accepts scheduled_delivery as ISO string (coerced to Date)', () => {
      const result = subcontractOrderCreateSchema.safeParse({
        ...validOrder(),
        scheduled_delivery: '2026-02-28T00:00:00Z',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.scheduled_delivery).toBeInstanceOf(Date)
      }
    })

    it('accepts scheduled_delivery as null (delivery date TBD)', () => {
      expect(
        subcontractOrderCreateSchema.safeParse({ ...validOrder(), scheduled_delivery: null }).success
      ).toBe(true)
    })

    it('accepts standard_scrap_pct with expected loss percentage', () => {
      const result = subcontractOrderCreateSchema.safeParse({
        ...validOrder(),
        standard_scrap_pct: '2.50',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.standard_scrap_pct).toBe('2.50')
      }
    })
  })

  describe('status enum — maquila lifecycle', () => {
    const statuses = ['draft', 'materials_sent', 'in_production', 'completed', 'cancelled'] as const

    test.each(statuses)('accepts status "%s"', (status) => {
      expect(subcontractOrderCreateSchema.safeParse({ ...validOrder(), status }).success).toBe(true)
    })

    it('rejects an invalid status', () => {
      expect(
        subcontractOrderCreateSchema.safeParse({ ...validOrder(), status: 'pending' }).success
      ).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// subcontractOrderUpdateSchema
// ---------------------------------------------------------------------------

describe('subcontractOrderUpdateSchema', () => {
  it('accepts an empty object', () => {
    expect(subcontractOrderUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('accepts a status-only update (draft → materials_sent)', () => {
    expect(subcontractOrderUpdateSchema.safeParse({ status: 'materials_sent' }).success).toBe(true)
  })

  it('accepts status update to in_production', () => {
    expect(subcontractOrderUpdateSchema.safeParse({ status: 'in_production' }).success).toBe(true)
  })

  it('accepts status update to completed', () => {
    expect(subcontractOrderUpdateSchema.safeParse({ status: 'completed' }).success).toBe(true)
  })

  it('still rejects invalid status in partial update', () => {
    expect(subcontractOrderUpdateSchema.safeParse({ status: 'pending' }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// subcontractMaterialCreateSchema
// ---------------------------------------------------------------------------

describe('subcontractMaterialCreateSchema', () => {
  describe('required fields', () => {
    it('accepts a minimal valid subcontract material', () => {
      expect(subcontractMaterialCreateSchema.safeParse(validMaterial()).success).toBe(true)
    })

    it('rejects when subcontract_order_id is not a UUID', () => {
      expect(
        subcontractMaterialCreateSchema.safeParse({ ...validMaterial(), subcontract_order_id: 'bad' }).success
      ).toBe(false)
    })

    it('rejects when material_id is not a UUID', () => {
      expect(
        subcontractMaterialCreateSchema.safeParse({ ...validMaterial(), material_id: 'bad' }).success
      ).toBe(false)
    })

    it('rejects when material_code is missing', () => {
      const { material_code: _omit, ...rest } = validMaterial()
      expect(subcontractMaterialCreateSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when quantity_sent is missing', () => {
      const { quantity_sent: _omit, ...rest } = validMaterial()
      expect(subcontractMaterialCreateSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects uom longer than 20 chars', () => {
      expect(
        subcontractMaterialCreateSchema.safeParse({ ...validMaterial(), uom: 'U'.repeat(21) }).success
      ).toBe(false)
    })

    it('accepts unit_cost_usd as null (cost recorded on PO — not on send)', () => {
      expect(
        subcontractMaterialCreateSchema.safeParse({ ...validMaterial(), unit_cost_usd: null }).success
      ).toBe(true)
    })

    it('accepts quantity_expected_back as null (calculated later from scrap %)', () => {
      expect(
        subcontractMaterialCreateSchema.safeParse({ ...validMaterial(), quantity_expected_back: null }).success
      ).toBe(true)
    })

    it('accepts quantity_expected_back with expected return quantity', () => {
      const result = subcontractMaterialCreateSchema.safeParse({
        ...validMaterial(),
        quantity_expected_back: '50960',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.quantity_expected_back).toBe('50960')
      }
    })

    it('accepts lot_id and lot_number for SENASAG-traceable materials', () => {
      const result = subcontractMaterialCreateSchema.safeParse({
        ...validMaterial(),
        lot_id: UUID,
        lot_number: 'LOTE-2026-001',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.lot_number).toBe('LOTE-2026-001')
      }
    })

    it('accepts lot_id and lot_number as null (non-lot-tracked material)', () => {
      expect(
        subcontractMaterialCreateSchema.safeParse({
          ...validMaterial(),
          lot_id: null,
          lot_number: null,
        }).success
      ).toBe(true)
    })

    it('accepts sent_date as ISO string (coerced to Date)', () => {
      const result = subcontractMaterialCreateSchema.safeParse({
        ...validMaterial(),
        sent_date: '2026-01-20T08:00:00Z',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.sent_date).toBeInstanceOf(Date)
      }
    })

    it('accepts sent_date as null (send date not yet confirmed)', () => {
      expect(
        subcontractMaterialCreateSchema.safeParse({ ...validMaterial(), sent_date: null }).success
      ).toBe(true)
    })
  })
})

// ---------------------------------------------------------------------------
// subcontractMaterialUpdateSchema
// ---------------------------------------------------------------------------

describe('subcontractMaterialUpdateSchema', () => {
  it('accepts an empty object', () => {
    expect(subcontractMaterialUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('accepts a sent_date-only update (recording actual dispatch date)', () => {
    expect(
      subcontractMaterialUpdateSchema.safeParse({ sent_date: new Date('2026-01-20T08:00:00Z') }).success
    ).toBe(true)
  })

  it('accepts quantity_expected_back update after scrap % calculated', () => {
    expect(
      subcontractMaterialUpdateSchema.safeParse({ quantity_expected_back: '50960' }).success
    ).toBe(true)
  })
})
