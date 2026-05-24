/**
 * Unit tests — condo_collections validators
 *
 * Venezuelan condo collections context:
 *   - createAgreementSchema: plan de pago para condóminos morosos —
 *     cuotas de pago acordadas por la junta de condominio
 *   - installments min(2) max(36): mínimo 2 cuotas, máximo 3 años
 *   - action_type 'legal_notice': notificación legal — primer paso
 *     antes de demanda ante Tribunal de Municipio
 *   - action_type 'assembly_report': reporte en asamblea — publicación
 *     pública de morosos (Ley de Propiedad Horizontal Art. 14)
 *   - result 'promised_payment': promesa de pago — documentada para
 *     seguimiento; no tiene valor legal pero se registra
 *   - min_months: filtro de morosos con X meses de atraso
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 */

import {
  listDebtorsSchema,
  createAgreementSchema,
  updateAgreementSchema,
  createActionSchema,
} from '../data/validators'

const UUID = '11111111-1111-4111-8111-111111111111'

const validAgreement = () => ({
  unit_id: UUID,
  total_debt: '640.00',
  installments: 4,
  installment_amount: '160.00',
  currency: 'USD',
  start_date: '2026-02-01',
})

const validAction = () => ({
  unit_id: UUID,
  action_type: 'whatsapp' as const,
  action_date: '2026-01-20',
  result: 'contacted' as const,
})

// ---------------------------------------------------------------------------
// listDebtorsSchema
// ---------------------------------------------------------------------------
describe('listDebtorsSchema', () => {
  it('accepts empty input with defaults', () => {
    const r = listDebtorsSchema.safeParse({})
    expect(r.success).toBe(true)
    if (r.success) { expect(r.data.page).toBe(1); expect(r.data.pageSize).toBe(50) }
  })
  it('coerces min_months from string', () => {
    const r = listDebtorsSchema.safeParse({ min_months: '3' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.min_months).toBe(3)
  })
  it('accepts building_id UUID filter', () => {
    expect(listDebtorsSchema.safeParse({ building_id: UUID }).success).toBe(true)
  })
  it('passes through unknown fields', () => {
    expect(listDebtorsSchema.safeParse({ extra: 'x' }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// createAgreementSchema
// ---------------------------------------------------------------------------
describe('createAgreementSchema', () => {
  it('accepts minimal agreement with defaults', () => {
    const r = createAgreementSchema.safeParse(validAgreement())
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.currency).toBe('USD')
  })
  it('rejects non-UUID unit_id', () => {
    expect(createAgreementSchema.safeParse({ ...validAgreement(), unit_id: 'bad' }).success).toBe(false)
  })
  it('rejects installments below 2', () => {
    expect(createAgreementSchema.safeParse({ ...validAgreement(), installments: 1 }).success).toBe(false)
  })
  it('rejects installments above 36', () => {
    expect(createAgreementSchema.safeParse({ ...validAgreement(), installments: 37 }).success).toBe(false)
  })
  it('coerces installments from string', () => {
    const r = createAgreementSchema.safeParse({ ...validAgreement(), installments: '6' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.installments).toBe(6)
  })
  it('accepts debtor_id as null (owner is the debtor)', () => {
    expect(createAgreementSchema.safeParse({ ...validAgreement(), debtor_id: null }).success).toBe(true)
  })
  it('accepts start_date as plain string', () => {
    const r = createAgreementSchema.safeParse(validAgreement())
    expect(r.success).toBe(true)
    if (r.success) expect(typeof r.data.start_date).toBe('string')
  })
  it('accepts notes as null', () => {
    expect(createAgreementSchema.safeParse({ ...validAgreement(), notes: null }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// updateAgreementSchema
// ---------------------------------------------------------------------------
describe('updateAgreementSchema', () => {
  it('accepts empty object', () => { expect(updateAgreementSchema.safeParse({}).success).toBe(true) })

  describe('status enum', () => {
    const statuses = ['active', 'completed', 'defaulted', 'cancelled'] as const
    test.each(statuses)('accepts status "%s"', (status) => {
      expect(updateAgreementSchema.safeParse({ status }).success).toBe(true)
    })
    it('rejects invalid status', () => {
      expect(updateAgreementSchema.safeParse({ status: 'pending' }).success).toBe(false)
    })
  })
  it('coerces paid_installments from string', () => {
    const r = updateAgreementSchema.safeParse({ paid_installments: '2' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.paid_installments).toBe(2)
  })
  it('accepts next_due_date as null', () => {
    expect(updateAgreementSchema.safeParse({ next_due_date: null }).success).toBe(true)
  })
  it('passes through unknown fields (passthrough schema)', () => {
    expect(updateAgreementSchema.safeParse({ custom_field: 'x' }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// createActionSchema
// ---------------------------------------------------------------------------
describe('createActionSchema', () => {
  it('accepts minimal action', () => {
    expect(createActionSchema.safeParse(validAction()).success).toBe(true)
  })
  it('rejects non-UUID unit_id', () => {
    expect(createActionSchema.safeParse({ ...validAction(), unit_id: 'bad' }).success).toBe(false)
  })
  it('rejects empty action_date', () => {
    expect(createActionSchema.safeParse({ ...validAction(), action_date: '' }).success).toBe(false)
  })
  it('accepts action_date as plain string', () => {
    const r = createActionSchema.safeParse(validAction())
    expect(r.success).toBe(true)
    if (r.success) expect(typeof r.data.action_date).toBe('string')
  })
  it('accepts next_action_date as null', () => {
    expect(createActionSchema.safeParse({ ...validAction(), next_action_date: null }).success).toBe(true)
  })
  it('accepts next_action_date as plain string', () => {
    expect(createActionSchema.safeParse({ ...validAction(), next_action_date: '2026-02-01' }).success).toBe(true)
  })

  describe('action_type enum', () => {
    const types = ['whatsapp', 'call', 'visit', 'letter', 'legal_notice', 'assembly_report'] as const
    test.each(types)('accepts action_type "%s"', (action_type) => {
      expect(createActionSchema.safeParse({ ...validAction(), action_type }).success).toBe(true)
    })
    it('rejects invalid action_type', () => {
      expect(createActionSchema.safeParse({ ...validAction(), action_type: 'email' }).success).toBe(false)
    })
  })

  describe('result enum', () => {
    const results = ['contacted', 'no_answer', 'promised_payment', 'refused', 'agreement_reached'] as const
    test.each(results)('accepts result "%s"', (result) => {
      expect(createActionSchema.safeParse({ ...validAction(), result }).success).toBe(true)
    })
    it('rejects invalid result', () => {
      expect(createActionSchema.safeParse({ ...validAction(), result: 'paid' }).success).toBe(false)
    })
  })
})
