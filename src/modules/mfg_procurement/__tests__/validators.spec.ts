/**
 * Unit tests — mfg_procurement validators
 *
 * Covers the Zod schemas for suppliers, purchase orders, and PO lines used in
 * the Manufacturing Procurement vertical.
 *
 * Venezuelan manufacturing procurement context:
 *   - payment_terms 'advance' is the dominant mode: Venezuelan suppliers require
 *     100% upfront due to forex scarcity (SENIAT IGTF applies to USD payments)
 *   - 'letter_of_credit' used for international imports via Venezuelan banks
 *   - dau_number: Declaración Aduanera Única — mandatory Venezuelan customs form
 *     for all imports (SENIAT/SENASA control)
 *   - bcv_rate_at_order: records official BCV rate at PO creation time for
 *     SENIAT cost reporting in Bolívares
 *   - status 'at_customs': unique to Venezuelan operations (prolonged customs
 *     clearance, sometimes weeks)
 *   - All monetary values in USD (dual-currency environment)
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 *
 * Reference: https://docs.open-mercato.dev/framework/api/api-development-guide
 * Spec: .ai/specs/ (Phase 24 — Manufactura Industrial)
 */

import {
  supplierCreateSchema,
  supplierUpdateSchema,
  purchaseOrderCreateSchema,
  purchaseOrderUpdateSchema,
  poLineCreateSchema,
  poLineUpdateSchema,
} from '../data/validators'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const UUID = '11111111-1111-4111-8111-111111111111'
const UUID2 = '22222222-2222-4222-8222-222222222222'

/** Minimal valid supplier payload. */
const validSupplier = () => ({
  supplier_code: 'PROV-001',
  name: 'Empaques del Sur C.A.',
})

/** Minimal valid purchase order payload. */
const validPO = () => ({
  po_number: 'PO-2026-001',
  supplier_id: UUID,
  supplier_name: 'Empaques del Sur C.A.',
})

/** Minimal valid PO line payload. */
const validPOLine = () => ({
  po_id: UUID,
  line_number: 1,
  material_id: UUID2,
  material_code: 'MP-ENV-001',
  material_name: 'Envase PET 500ml',
  quantity: '10000',
  uom: 'UNID',
  unit_price: '0.05',
  total_price: '500.00',
})

// ---------------------------------------------------------------------------
// supplierCreateSchema
// ---------------------------------------------------------------------------

describe('supplierCreateSchema', () => {
  describe('required fields and defaults', () => {
    it('accepts a minimal valid supplier with defaults', () => {
      const result = supplierCreateSchema.safeParse(validSupplier())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.supplier_type).toBe('national')
        expect(result.data.payment_terms).toBe('advance')
        expect(result.data.currency).toBe('USD')
        expect(result.data.is_active).toBe(true)
      }
    })

    it('rejects when supplier_code is missing', () => {
      const { supplier_code: _omit, ...rest } = validSupplier()
      expect(supplierCreateSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when name is missing', () => {
      const { name: _omit, ...rest } = validSupplier()
      expect(supplierCreateSchema.safeParse(rest).success).toBe(false)
    })

    it('accepts a valid contact_email', () => {
      expect(
        supplierCreateSchema.safeParse({ ...validSupplier(), contact_email: 'ventas@empaques.com.ve' }).success
      ).toBe(true)
    })

    it('rejects an invalid contact_email format', () => {
      expect(
        supplierCreateSchema.safeParse({ ...validSupplier(), contact_email: 'not-an-email' }).success
      ).toBe(false)
    })

    it('accepts contact_email as null (no email on file)', () => {
      expect(supplierCreateSchema.safeParse({ ...validSupplier(), contact_email: null }).success).toBe(true)
    })

    it('accepts optional fields as null', () => {
      expect(
        supplierCreateSchema.safeParse({
          ...validSupplier(),
          country: null,
          contact_name: null,
          contact_phone: null,
          notes: null,
        }).success
      ).toBe(true)
    })
  })

  describe('supplier_type enum', () => {
    const types = ['national', 'international'] as const

    test.each(types)('accepts supplier_type "%s"', (supplier_type) => {
      expect(supplierCreateSchema.safeParse({ ...validSupplier(), supplier_type }).success).toBe(true)
    })

    it('rejects an invalid supplier_type', () => {
      expect(supplierCreateSchema.safeParse({ ...validSupplier(), supplier_type: 'regional' }).success).toBe(false)
    })
  })

  describe('payment_terms enum — Venezuelan procurement reality', () => {
    // 'advance' dominates due to forex scarcity; 'letter_of_credit' for imports
    const terms = ['advance', 'letter_of_credit', 'net_30', 'net_60', 'open_account'] as const

    test.each(terms)('accepts payment_terms "%s"', (payment_terms) => {
      expect(supplierCreateSchema.safeParse({ ...validSupplier(), payment_terms }).success).toBe(true)
    })

    it('rejects an invalid payment_terms', () => {
      expect(supplierCreateSchema.safeParse({ ...validSupplier(), payment_terms: 'net_15' }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// supplierUpdateSchema
// ---------------------------------------------------------------------------

describe('supplierUpdateSchema', () => {
  it('accepts an empty object', () => {
    expect(supplierUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('accepts is_active-only update (deactivating supplier)', () => {
    expect(supplierUpdateSchema.safeParse({ is_active: false }).success).toBe(true)
  })

  it('still rejects invalid payment_terms in partial update', () => {
    expect(supplierUpdateSchema.safeParse({ payment_terms: 'net_15' }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// purchaseOrderCreateSchema
// ---------------------------------------------------------------------------

describe('purchaseOrderCreateSchema', () => {
  describe('required fields and defaults', () => {
    it('accepts a minimal valid PO with defaults', () => {
      const result = purchaseOrderCreateSchema.safeParse(validPO())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.po_type).toBe('national')
        expect(result.data.status).toBe('draft')
        expect(result.data.currency).toBe('USD')
        expect(result.data.subtotal_fob).toBe('0.00')
        expect(result.data.freight_cost).toBe('0.00')
        expect(result.data.insurance_cost).toBe('0.00')
        expect(result.data.tariff_cost).toBe('0.00')
        expect(result.data.import_vat).toBe('0.00')
        expect(result.data.agency_fees).toBe('0.00')
        expect(result.data.inland_transport).toBe('0.00')
        expect(result.data.total_cif_cost).toBe('0.00')
      }
    })

    it('rejects when po_number is missing', () => {
      const { po_number: _omit, ...rest } = validPO()
      expect(purchaseOrderCreateSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when supplier_id is not a UUID', () => {
      expect(purchaseOrderCreateSchema.safeParse({ ...validPO(), supplier_id: 'bad' }).success).toBe(false)
    })

    it('accepts dau_number (Declaración Aduanera Única — Venezuelan customs)', () => {
      const result = purchaseOrderCreateSchema.safeParse({
        ...validPO(),
        dau_number: 'DAU-2026-00123',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.dau_number).toBe('DAU-2026-00123')
      }
    })

    it('accepts bcv_rate_at_order for SENIAT Bolívar reporting', () => {
      const result = purchaseOrderCreateSchema.safeParse({
        ...validPO(),
        bcv_rate_at_order: '36.4521',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.bcv_rate_at_order).toBe('36.4521')
      }
    })

    it('accepts estimated dates as ISO strings (coerced to Date)', () => {
      const result = purchaseOrderCreateSchema.safeParse({
        ...validPO(),
        estimated_ship_date: '2026-03-01',
        estimated_arrival_port: '2026-03-15',
        estimated_customs_clearance: '2026-03-20',
        estimated_warehouse_arrival: '2026-03-22',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.estimated_ship_date).toBeInstanceOf(Date)
        expect(result.data.estimated_arrival_port).toBeInstanceOf(Date)
      }
    })

    it('accepts all date fields as null (domestic PO — no shipping dates)', () => {
      expect(
        purchaseOrderCreateSchema.safeParse({
          ...validPO(),
          estimated_ship_date: null,
          estimated_arrival_port: null,
          estimated_customs_clearance: null,
          estimated_warehouse_arrival: null,
        }).success
      ).toBe(true)
    })
  })

  describe('po_type enum', () => {
    const types = ['national', 'international'] as const

    test.each(types)('accepts po_type "%s"', (po_type) => {
      expect(purchaseOrderCreateSchema.safeParse({ ...validPO(), po_type }).success).toBe(true)
    })

    it('rejects an invalid po_type', () => {
      expect(purchaseOrderCreateSchema.safeParse({ ...validPO(), po_type: 'regional' }).success).toBe(false)
    })
  })

  describe('status enum — Venezuelan import lifecycle', () => {
    // at_customs: prolonged customs clearance is a normal Venezuelan operational reality
    const statuses = ['draft', 'sent', 'confirmed', 'in_transit', 'at_customs', 'delivered', 'cancelled'] as const

    test.each(statuses)('accepts status "%s"', (status) => {
      expect(purchaseOrderCreateSchema.safeParse({ ...validPO(), status }).success).toBe(true)
    })

    it('rejects an invalid status', () => {
      expect(purchaseOrderCreateSchema.safeParse({ ...validPO(), status: 'pending' }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// purchaseOrderUpdateSchema
// ---------------------------------------------------------------------------

describe('purchaseOrderUpdateSchema', () => {
  it('accepts an empty object', () => {
    expect(purchaseOrderUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('accepts a status-only update (in_transit → at_customs)', () => {
    expect(purchaseOrderUpdateSchema.safeParse({ status: 'at_customs' }).success).toBe(true)
  })

  it('still rejects invalid status in partial update', () => {
    expect(purchaseOrderUpdateSchema.safeParse({ status: 'pending' }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// poLineCreateSchema
// ---------------------------------------------------------------------------

describe('poLineCreateSchema', () => {
  describe('required fields', () => {
    it('accepts a minimal valid PO line', () => {
      expect(poLineCreateSchema.safeParse(validPOLine()).success).toBe(true)
    })

    it('rejects when po_id is not a UUID', () => {
      expect(poLineCreateSchema.safeParse({ ...validPOLine(), po_id: 'bad' }).success).toBe(false)
    })

    it('rejects when material_id is not a UUID', () => {
      expect(poLineCreateSchema.safeParse({ ...validPOLine(), material_id: 'bad' }).success).toBe(false)
    })

    it('rejects line_number = 0 (must be positive)', () => {
      expect(poLineCreateSchema.safeParse({ ...validPOLine(), line_number: 0 }).success).toBe(false)
    })

    it('rejects negative line_number', () => {
      expect(poLineCreateSchema.safeParse({ ...validPOLine(), line_number: -1 }).success).toBe(false)
    })

    it('rejects when material_code is missing', () => {
      const { material_code: _omit, ...rest } = validPOLine()
      expect(poLineCreateSchema.safeParse(rest).success).toBe(false)
    })

    it('accepts requisition_id as null (direct purchase — no requisition)', () => {
      expect(poLineCreateSchema.safeParse({ ...validPOLine(), requisition_id: null }).success).toBe(true)
    })

    it('rejects uom longer than 20 chars', () => {
      expect(poLineCreateSchema.safeParse({ ...validPOLine(), uom: 'U'.repeat(21) }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// poLineUpdateSchema
// ---------------------------------------------------------------------------

describe('poLineUpdateSchema', () => {
  it('accepts an empty object', () => {
    expect(poLineUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('accepts a quantity-only update', () => {
    expect(poLineUpdateSchema.safeParse({ quantity: '12000' }).success).toBe(true)
  })
})
