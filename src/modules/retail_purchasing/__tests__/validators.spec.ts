/**
 * Unit tests — retail_purchasing validators
 *
 * Venezuelan retail purchasing context:
 *   - rif: RIF del proveedor — required for SENIAT fiscal invoicing
 *   - exchange_rate: tasa BCV al momento de la OC — purchase orders in USD
 *     but payments may be converted to VES for SENIAT reporting
 *   - status 'partially_received': recepción parcial — common when supplier
 *     cannot fulfill complete order (escasez de materias primas)
 *   - registerPaymentSchema: pago a proveedor — payment_method includes
 *     'transferencia', 'zelle', 'pago_movil' in Venezuela
 *   - createSupplierNoteSchema: notas de débito/crédito a proveedores —
 *     fiscal documents required by SENIAT for adjustments
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 */

import {
  createSupplierSchema,
  updateSupplierSchema,
  listSuppliersSchema,
  createPurchaseOrderSchema,
  updatePurchaseOrderSchema,
  listPurchaseOrdersSchema,
  listPayablesSchema,
  registerPaymentSchema,
  createSupplierNoteSchema,
  listSupplierNotesSchema,
} from '../data/validators'

const UUID  = '11111111-1111-4111-8111-111111111111'
const UUID2 = '22222222-2222-4222-8222-222222222222'

const validSupplier = () => ({ name: 'Distribuidora Industrial C.A.' })
const validPO = () => ({
  supplier_id: UUID,
  lines: [{ product_id: UUID2, quantity_ordered: 100, unit_cost: '3.50' }],
})
const validPayment = () => ({ payable_id: UUID, amount: '1500.00' })
const validNote = () => ({ supplier_id: UUID, type: 'debit' as const, amount: '250.00' })

// ---------------------------------------------------------------------------
// createSupplierSchema
// ---------------------------------------------------------------------------
describe('createSupplierSchema', () => {
  it('accepts minimal supplier with defaults', () => {
    const r = createSupplierSchema.safeParse(validSupplier())
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.default_payment_days).toBe(30)
      expect(r.data.currency).toBe('USD')
    }
  })
  it('rejects missing name', () => {
    expect(createSupplierSchema.safeParse({}).success).toBe(false)
  })
  it('rejects default_payment_days below 0', () => {
    expect(createSupplierSchema.safeParse({ ...validSupplier(), default_payment_days: -1 }).success).toBe(false)
  })
  it('accepts valid email', () => {
    expect(createSupplierSchema.safeParse({ ...validSupplier(), email: 'ventas@proveedor.com' }).success).toBe(true)
  })
  it('rejects invalid email', () => {
    expect(createSupplierSchema.safeParse({ ...validSupplier(), email: 'bad' }).success).toBe(false)
  })
  it('accepts rif as null', () => {
    expect(createSupplierSchema.safeParse({ ...validSupplier(), rif: null }).success).toBe(true)
  })
  it('accepts category_ids as UUID array', () => {
    expect(createSupplierSchema.safeParse({ ...validSupplier(), category_ids: [UUID] }).success).toBe(true)
  })
})

describe('updateSupplierSchema', () => {
  it('accepts empty object', () => { expect(updateSupplierSchema.safeParse({}).success).toBe(true) })
  it('accepts currency update', () => {
    expect(updateSupplierSchema.safeParse({ currency: 'USD' }).success).toBe(true)
  })
})

describe('listSuppliersSchema', () => {
  it('accepts empty input with defaults', () => {
    const r = listSuppliersSchema.safeParse({})
    expect(r.success).toBe(true)
    if (r.success) { expect(r.data.page).toBe(1); expect(r.data.pageSize).toBe(50) }
  })
  it('coerces is_active from string', () => {
    const r = listSuppliersSchema.safeParse({ is_active: 'false' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.is_active).toBe(false)
  })
  it('passes through unknown fields', () => {
    expect(listSuppliersSchema.safeParse({ extra: 'x' }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// createPurchaseOrderSchema
// ---------------------------------------------------------------------------
describe('createPurchaseOrderSchema', () => {
  it('accepts minimal PO with defaults', () => {
    const r = createPurchaseOrderSchema.safeParse(validPO())
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.currency).toBe('USD')
  })
  it('rejects non-UUID supplier_id', () => {
    expect(createPurchaseOrderSchema.safeParse({ ...validPO(), supplier_id: 'bad' }).success).toBe(false)
  })
  it('rejects empty lines (min 1)', () => {
    expect(createPurchaseOrderSchema.safeParse({ ...validPO(), lines: [] }).success).toBe(false)
  })
  it('rejects line quantity_ordered below 1', () => {
    expect(createPurchaseOrderSchema.safeParse({
      ...validPO(), lines: [{ product_id: UUID2, quantity_ordered: 0, unit_cost: '3.50' }],
    }).success).toBe(false)
  })
  it('accepts exchange_rate as BCV rate string', () => {
    const r = createPurchaseOrderSchema.safeParse({ ...validPO(), exchange_rate: '36.45' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.exchange_rate).toBe('36.45')
  })
  it('accepts exchange_rate as null (USD-only)', () => {
    expect(createPurchaseOrderSchema.safeParse({ ...validPO(), exchange_rate: null }).success).toBe(true)
  })
  it('accepts branch_id as null (no specific branch)', () => {
    expect(createPurchaseOrderSchema.safeParse({ ...validPO(), branch_id: null }).success).toBe(true)
  })
  it('accepts expected_delivery_date as plain string', () => {
    const r = createPurchaseOrderSchema.safeParse({ ...validPO(), expected_delivery_date: '2026-02-15' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.expected_delivery_date).toBe('2026-02-15')
  })
})

describe('updatePurchaseOrderSchema', () => {
  it('accepts empty object', () => { expect(updatePurchaseOrderSchema.safeParse({}).success).toBe(true) })

  describe('status enum', () => {
    const statuses = ['sent', 'partially_received', 'received', 'cancelled'] as const
    test.each(statuses)('accepts status "%s"', (status) => {
      expect(updatePurchaseOrderSchema.safeParse({ status }).success).toBe(true)
    })
    it('rejects invalid status', () => {
      expect(updatePurchaseOrderSchema.safeParse({ status: 'draft' }).success).toBe(false)
    })
  })
  it('accepts lines with received quantities', () => {
    const r = updatePurchaseOrderSchema.safeParse({
      lines: [{ id: UUID, quantity_received: 80 }],
    })
    expect(r.success).toBe(true)
  })
  it('rejects quantity_received below 0', () => {
    expect(updatePurchaseOrderSchema.safeParse({
      lines: [{ id: UUID, quantity_received: -1 }],
    }).success).toBe(false)
  })
})

describe('listPurchaseOrdersSchema', () => {
  it('accepts empty input with defaults', () => {
    const r = listPurchaseOrdersSchema.safeParse({})
    expect(r.success).toBe(true)
    if (r.success) { expect(r.data.page).toBe(1); expect(r.data.pageSize).toBe(50) }
  })

  describe('status filter enum', () => {
    const statuses = ['draft', 'sent', 'partially_received', 'received', 'cancelled'] as const
    test.each(statuses)('accepts status filter "%s"', (status) => {
      expect(listPurchaseOrdersSchema.safeParse({ status }).success).toBe(true)
    })
  })
  it('accepts supplier_id filter', () => {
    expect(listPurchaseOrdersSchema.safeParse({ supplier_id: UUID }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// listPayablesSchema
// ---------------------------------------------------------------------------
describe('listPayablesSchema', () => {
  it('accepts empty input with defaults', () => {
    const r = listPayablesSchema.safeParse({})
    expect(r.success).toBe(true)
    if (r.success) { expect(r.data.page).toBe(1); expect(r.data.pageSize).toBe(50) }
  })

  describe('status filter enum', () => {
    const statuses = ['pending', 'partially_paid', 'paid', 'overdue', 'cancelled'] as const
    test.each(statuses)('accepts status filter "%s"', (status) => {
      expect(listPayablesSchema.safeParse({ status }).success).toBe(true)
    })
  })
})

// ---------------------------------------------------------------------------
// registerPaymentSchema
// ---------------------------------------------------------------------------
describe('registerPaymentSchema', () => {
  it('accepts minimal payment', () => {
    expect(registerPaymentSchema.safeParse(validPayment()).success).toBe(true)
  })
  it('rejects non-UUID payable_id', () => {
    expect(registerPaymentSchema.safeParse({ ...validPayment(), payable_id: 'bad' }).success).toBe(false)
  })
  it('accepts payment_method string', () => {
    const r = registerPaymentSchema.safeParse({ ...validPayment(), payment_method: 'zelle' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.payment_method).toBe('zelle')
  })
  it('accepts reference as null', () => {
    expect(registerPaymentSchema.safeParse({ ...validPayment(), reference: null }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// createSupplierNoteSchema
// ---------------------------------------------------------------------------
describe('createSupplierNoteSchema', () => {
  it('accepts minimal debit note', () => {
    expect(createSupplierNoteSchema.safeParse(validNote()).success).toBe(true)
  })

  describe('type enum', () => {
    const types = ['debit', 'credit'] as const
    test.each(types)('accepts type "%s"', (type) => {
      expect(createSupplierNoteSchema.safeParse({ ...validNote(), type }).success).toBe(true)
    })
    it('rejects invalid type', () => {
      expect(createSupplierNoteSchema.safeParse({ ...validNote(), type: 'adjustment' }).success).toBe(false)
    })
  })
  it('accepts purchase_order_id as null', () => {
    expect(createSupplierNoteSchema.safeParse({ ...validNote(), purchase_order_id: null }).success).toBe(true)
  })
})

describe('listSupplierNotesSchema', () => {
  it('accepts empty input with defaults', () => {
    const r = listSupplierNotesSchema.safeParse({})
    expect(r.success).toBe(true)
    if (r.success) { expect(r.data.page).toBe(1); expect(r.data.pageSize).toBe(50) }
  })

  describe('type filter enum', () => {
    const types = ['debit', 'credit'] as const
    test.each(types)('accepts type filter "%s"', (type) => {
      expect(listSupplierNotesSchema.safeParse({ type }).success).toBe(true)
    })
  })
})
