/**
 * Unit tests — condo_fees validators
 *
 * Venezuelan condo fees context:
 *   - fee_type 'extraordinary': cuota extraordinaria — voted in assembly for
 *     one-time expenses (e.g., elevator repair, roof replacement)
 *   - distribution_method 'aliquot': cobro proporcional a la alícuota
 *     (standard method per Ley de Propiedad Horizontal Art. 7)
 *   - late_fee_days default 15: días de gracia antes de mora
 *   - approved_in_assembly: cuotas extraordinarias requieren aprobación en
 *     asamblea de condóminos (Ley de Propiedad Horizontal)
 *   - period_month YYYY-MM: mes de causación (devengado)
 *   - payReceiptSchema: registra pago individual — método puede ser
 *     'transferencia', 'zelle', 'pago_movil', 'efectivo_usd'
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 */

import {
  createFeeConfigSchema,
  updateFeeConfigSchema,
  listFeeConfigsSchema,
  listReceiptsSchema,
  generateReceiptsSchema,
  payReceiptSchema,
} from '../data/validators'

const UUID = '11111111-1111-4111-8111-111111111111'

const validFee = () => ({
  building_id: UUID,
  name: 'Cuota Ordinaria Enero 2026',
  fee_type: 'ordinary' as const,
  period_month: '2026-01',
  base_amount: '80.00',
  distribution_method: 'aliquot' as const,
  due_date: '2026-01-15',
})
const validPayReceipt = () => ({
  receipt_id: UUID, paid_amount: '80.00', payment_method: 'transferencia',
})

// ---------------------------------------------------------------------------
// createFeeConfigSchema
// ---------------------------------------------------------------------------
describe('createFeeConfigSchema', () => {
  it('accepts minimal fee config with defaults', () => {
    const r = createFeeConfigSchema.safeParse(validFee())
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.currency).toBe('USD')
      expect(r.data.late_fee_percent).toBe('0.00')
      expect(r.data.late_fee_days).toBe(15)
      expect(r.data.approved_in_assembly).toBe(false)
      expect(r.data.status).toBe('draft')
    }
  })
  it('rejects non-UUID building_id', () => {
    expect(createFeeConfigSchema.safeParse({ ...validFee(), building_id: 'bad' }).success).toBe(false)
  })
  it('rejects invalid period_month (missing leading zero)', () => {
    expect(createFeeConfigSchema.safeParse({ ...validFee(), period_month: '2026-1' }).success).toBe(false)
  })
  it('accepts period_month "2026-01"', () => {
    expect(createFeeConfigSchema.safeParse({ ...validFee(), period_month: '2026-01' }).success).toBe(true)
  })
  it('accepts approved_in_assembly = true with assembly_date', () => {
    const r = createFeeConfigSchema.safeParse({
      ...validFee(), fee_type: 'extraordinary',
      approved_in_assembly: true, assembly_date: '2026-01-10',
    })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.approved_in_assembly).toBe(true)
  })
  it('accepts assembly_date as null', () => {
    expect(createFeeConfigSchema.safeParse({ ...validFee(), assembly_date: null }).success).toBe(true)
  })
  it('coerces late_fee_days from string', () => {
    const r = createFeeConfigSchema.safeParse({ ...validFee(), late_fee_days: '30' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.late_fee_days).toBe(30)
  })

  describe('fee_type enum', () => {
    const types = ['ordinary', 'extraordinary', 'special'] as const
    test.each(types)('accepts fee_type "%s"', (fee_type) => {
      expect(createFeeConfigSchema.safeParse({ ...validFee(), fee_type }).success).toBe(true)
    })
    it('rejects invalid fee_type', () => {
      expect(createFeeConfigSchema.safeParse({ ...validFee(), fee_type: 'reserve' }).success).toBe(false)
    })
  })

  describe('distribution_method enum', () => {
    const methods = ['aliquot', 'equal', 'custom'] as const
    test.each(methods)('accepts distribution_method "%s"', (distribution_method) => {
      expect(createFeeConfigSchema.safeParse({ ...validFee(), distribution_method }).success).toBe(true)
    })
    it('rejects invalid distribution_method', () => {
      expect(createFeeConfigSchema.safeParse({ ...validFee(), distribution_method: 'proportional' }).success).toBe(false)
    })
  })

  describe('status enum', () => {
    const statuses = ['draft', 'approved', 'generated', 'closed'] as const
    test.each(statuses)('accepts status "%s"', (status) => {
      expect(createFeeConfigSchema.safeParse({ ...validFee(), status }).success).toBe(true)
    })
    it('rejects invalid status', () => {
      expect(createFeeConfigSchema.safeParse({ ...validFee(), status: 'active' }).success).toBe(false)
    })
  })
})

describe('updateFeeConfigSchema', () => {
  it('accepts empty object', () => { expect(updateFeeConfigSchema.safeParse({}).success).toBe(true) })
  it('accepts status update (draft → approved)', () => {
    expect(updateFeeConfigSchema.safeParse({ status: 'approved' }).success).toBe(true)
  })
  it('still rejects invalid fee_type in partial update', () => {
    expect(updateFeeConfigSchema.safeParse({ fee_type: 'reserve' }).success).toBe(false)
  })
})

describe('listFeeConfigsSchema', () => {
  it('accepts empty input with defaults', () => {
    const r = listFeeConfigsSchema.safeParse({})
    expect(r.success).toBe(true)
    if (r.success) { expect(r.data.page).toBe(1); expect(r.data.pageSize).toBe(50) }
  })
  it('accepts building_id and period_month filters', () => {
    expect(listFeeConfigsSchema.safeParse({ building_id: UUID, period_month: '2026-01' }).success).toBe(true)
  })
  it('passes through unknown fields', () => {
    expect(listFeeConfigsSchema.safeParse({ extra: 'x' }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// listReceiptsSchema
// ---------------------------------------------------------------------------
describe('listReceiptsSchema', () => {
  it('accepts empty input with defaults', () => {
    const r = listReceiptsSchema.safeParse({})
    expect(r.success).toBe(true)
    if (r.success) { expect(r.data.page).toBe(1); expect(r.data.pageSize).toBe(50) }
  })
  it('accepts all UUID filters', () => {
    expect(listReceiptsSchema.safeParse({
      building_id: UUID, fee_config_id: UUID, unit_id: UUID,
    }).success).toBe(true)
  })
  it('accepts period_month filter', () => {
    expect(listReceiptsSchema.safeParse({ period_month: '2026-01' }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// generateReceiptsSchema
// ---------------------------------------------------------------------------
describe('generateReceiptsSchema', () => {
  it('accepts valid fee_config_id', () => {
    expect(generateReceiptsSchema.safeParse({ fee_config_id: UUID }).success).toBe(true)
  })
  it('rejects non-UUID fee_config_id', () => {
    expect(generateReceiptsSchema.safeParse({ fee_config_id: 'bad' }).success).toBe(false)
  })
  it('rejects missing fee_config_id', () => {
    expect(generateReceiptsSchema.safeParse({}).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// payReceiptSchema
// ---------------------------------------------------------------------------
describe('payReceiptSchema', () => {
  it('accepts minimal pay receipt', () => {
    expect(payReceiptSchema.safeParse(validPayReceipt()).success).toBe(true)
  })
  it('rejects non-UUID receipt_id', () => {
    expect(payReceiptSchema.safeParse({ ...validPayReceipt(), receipt_id: 'bad' }).success).toBe(false)
  })
  it('rejects missing payment_method', () => {
    const { payment_method: _o, ...rest } = validPayReceipt()
    expect(payReceiptSchema.safeParse(rest).success).toBe(false)
  })
  it('accepts payment_reference as null', () => {
    expect(payReceiptSchema.safeParse({ ...validPayReceipt(), payment_reference: null }).success).toBe(true)
  })
  it('accepts payment_reference string (pago móvil reference)', () => {
    const r = payReceiptSchema.safeParse({ ...validPayReceipt(), payment_reference: 'PM-2026-001234' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.payment_reference).toBe('PM-2026-001234')
  })
})
