/**
 * Unit tests — condo_accounting validators
 *
 * Venezuelan condo accounting context:
 *   - entry_type 'income': ingresos — cuotas recibidas, intereses moratorios
 *   - entry_type 'expense': egresos — mantenimiento, nómina, servicios
 *   - category 'reserve_fund': fondo de reserva — obligatorio por Ley de
 *     Propiedad Horizontal; typically 10% of ordinary income
 *   - category 'utilities': servicios públicos — HIDROCAPITAL, gas, basura
 *   - is_reserve_fund: entrada que afecta el fondo de reserva
 *   - exchange_rate: tasa BCV — SENIAT requires VES equivalent on all income/
 *     expense records for fiscal reporting purposes
 *   - reserve_fund_percent default '10.00': 10% fondo de reserva
 *   - approved_in_assembly: presupuesto aprobado en asamblea ordinaria
 *     (Ley de Propiedad Horizontal Art. 24 — annual assembly requirement)
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 */

import {
  createEntrySchema,
  updateEntrySchema,
  createBudgetSchema,
  updateBudgetSchema,
} from '../data/validators'

const UUID = '11111111-1111-4111-8111-111111111111'

const validEntry = () => ({
  building_id: UUID,
  entry_type: 'income' as const,
  category: 'condo_fee' as const,
  description: 'Recaudación cuotas ordinarias enero 2026',
  amount: '2400.00',
  entry_date: '2026-01-31',
  period_month: '2026-01',
})
const validBudget = () => ({
  building_id: UUID,
  year: 2026,
  total_income: '28800.00',
  total_expenses: '25920.00',
})

// ---------------------------------------------------------------------------
// createEntrySchema
// ---------------------------------------------------------------------------
describe('createEntrySchema', () => {
  it('accepts minimal entry with defaults', () => {
    const r = createEntrySchema.safeParse(validEntry())
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.currency).toBe('USD')
      expect(r.data.is_reserve_fund).toBe(false)
    }
  })
  it('rejects non-UUID building_id', () => {
    expect(createEntrySchema.safeParse({ ...validEntry(), building_id: 'bad' }).success).toBe(false)
  })
  it('rejects empty description', () => {
    expect(createEntrySchema.safeParse({ ...validEntry(), description: '' }).success).toBe(false)
  })
  it('rejects invalid period_month (missing zero)', () => {
    expect(createEntrySchema.safeParse({ ...validEntry(), period_month: '2026-1' }).success).toBe(false)
  })
  it('accepts period_month "2026-01"', () => {
    expect(createEntrySchema.safeParse({ ...validEntry(), period_month: '2026-01' }).success).toBe(true)
  })
  it('accepts entry_date as plain string', () => {
    const r = createEntrySchema.safeParse(validEntry())
    expect(r.success).toBe(true)
    if (r.success) expect(typeof r.data.entry_date).toBe('string')
  })
  it('accepts exchange_rate for BCV reporting', () => {
    const r = createEntrySchema.safeParse({ ...validEntry(), exchange_rate: '36.45' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.exchange_rate).toBe('36.45')
  })
  it('accepts exchange_rate as null', () => {
    expect(createEntrySchema.safeParse({ ...validEntry(), exchange_rate: null }).success).toBe(true)
  })
  it('accepts is_reserve_fund = true', () => {
    const r = createEntrySchema.safeParse({
      ...validEntry(), category: 'reserve_fund', is_reserve_fund: true,
    })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.is_reserve_fund).toBe(true)
  })

  describe('entry_type enum', () => {
    const types = ['income', 'expense'] as const
    test.each(types)('accepts entry_type "%s"', (entry_type) => {
      expect(createEntrySchema.safeParse({ ...validEntry(), entry_type }).success).toBe(true)
    })
    it('rejects invalid entry_type', () => {
      expect(createEntrySchema.safeParse({ ...validEntry(), entry_type: 'transfer' }).success).toBe(false)
    })
  })

  describe('category enum', () => {
    const cats = ['condo_fee', 'extraordinary', 'reserve_fund', 'maintenance', 'utilities', 'payroll', 'insurance', 'legal', 'other'] as const
    test.each(cats)('accepts category "%s"', (category) => {
      expect(createEntrySchema.safeParse({ ...validEntry(), category }).success).toBe(true)
    })
    it('rejects invalid category', () => {
      expect(createEntrySchema.safeParse({ ...validEntry(), category: 'investment' }).success).toBe(false)
    })
  })
})

describe('updateEntrySchema', () => {
  it('accepts empty object', () => { expect(updateEntrySchema.safeParse({}).success).toBe(true) })
  it('accepts amount update (correction)', () => {
    expect(updateEntrySchema.safeParse({ amount: '2450.00' }).success).toBe(true)
  })
  it('still rejects invalid entry_type in partial update', () => {
    expect(updateEntrySchema.safeParse({ entry_type: 'transfer' }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// createBudgetSchema
// ---------------------------------------------------------------------------
describe('createBudgetSchema', () => {
  it('accepts minimal budget with defaults', () => {
    const r = createBudgetSchema.safeParse(validBudget())
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.status).toBe('draft')
      expect(r.data.reserve_fund_percent).toBe('10.00')
      expect(r.data.currency).toBe('USD')
      expect(r.data.approved_in_assembly).toBe(false)
    }
  })
  it('rejects non-UUID building_id', () => {
    expect(createBudgetSchema.safeParse({ ...validBudget(), building_id: 'bad' }).success).toBe(false)
  })
  it('rejects year below 2020', () => {
    expect(createBudgetSchema.safeParse({ ...validBudget(), year: 2019 }).success).toBe(false)
  })
  it('coerces year from string', () => {
    const r = createBudgetSchema.safeParse({ ...validBudget(), year: '2026' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.year).toBe(2026)
  })
  it('accepts approved_in_assembly = true with assembly_date', () => {
    const r = createBudgetSchema.safeParse({
      ...validBudget(), approved_in_assembly: true, assembly_date: '2026-01-15',
    })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.approved_in_assembly).toBe(true)
  })
  it('accepts assembly_date as null', () => {
    expect(createBudgetSchema.safeParse({ ...validBudget(), assembly_date: null }).success).toBe(true)
  })

  describe('status enum', () => {
    const statuses = ['draft', 'approved', 'active', 'closed'] as const
    test.each(statuses)('accepts status "%s"', (status) => {
      expect(createBudgetSchema.safeParse({ ...validBudget(), status }).success).toBe(true)
    })
    it('rejects invalid status', () => {
      expect(createBudgetSchema.safeParse({ ...validBudget(), status: 'pending' }).success).toBe(false)
    })
  })
})

describe('updateBudgetSchema', () => {
  it('accepts empty object', () => { expect(updateBudgetSchema.safeParse({}).success).toBe(true) })
  it('accepts status update (draft → approved)', () => {
    expect(updateBudgetSchema.safeParse({ status: 'approved' }).success).toBe(true)
  })
  it('still rejects invalid status in partial update', () => {
    expect(updateBudgetSchema.safeParse({ status: 'pending' }).success).toBe(false)
  })
})
