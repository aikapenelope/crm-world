/**
 * Unit tests — tuition validators
 *
 * Venezuelan school tuition context:
 *   - due_day max 28: día de vencimiento — máximo día 28 para evitar
 *     ambigüedad en febrero (regla LOTTT de pagos recurrentes en Venezuela)
 *   - concept 'mensualidad': cuota mensual de enseñanza — principal concepto
 *   - concept 'inscripcion': arancel de inscripción — cobro anual MPPE
 *   - exchange_rate: tasa BCV — aranceles en USD pero recibos emitidos en
 *     VES según normativa SENIAT para colegios privados
 *   - discount_type 'sibling': descuento por hermanos — práctica común
 *     en colegios venezolanos (10-15% por hermano adicional)
 *   - discount_type 'scholarship': beca escolar — parcial o total
 *   - period_month regex /^\d{4}-\d{2}$/ — mes de causación del cobro
 *   - updateChargeSchema omits student_id (charge belongs to student)
 *   - updateDiscountSchema omits student_id
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 */

import {
  createPlanSchema,
  updatePlanSchema,
  createChargeSchema,
  updateChargeSchema,
  createPaymentSchema,
  createDiscountSchema,
  updateDiscountSchema,
} from '../data/validators'

const UUID  = '11111111-1111-4111-8111-111111111111'
const UUID2 = '22222222-2222-4222-8222-222222222222'

const validPlan = () => ({ name: 'Plan Mensual 2025-2026', monthly_amount: '150.00' })
const validCharge = () => ({
  student_id: UUID,
  period_month: '2026-01',
  amount: '150.00',
  due_date: '2026-01-05',
})
const validPayment = () => ({
  charge_id: UUID,
  student_id: UUID2,
  amount: '150.00',
  currency: 'USD',
  payment_date: '2026-01-04',
})
const validDiscount = () => ({
  student_id: UUID,
  discount_type: 'sibling' as const,
  reason: 'Descuento por hermano — Carlos Pérez (primaria_5)',
})

// ---------------------------------------------------------------------------
// createPlanSchema
// ---------------------------------------------------------------------------
describe('createPlanSchema', () => {
  it('accepts minimal plan with defaults', () => {
    const r = createPlanSchema.safeParse(validPlan())
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.currency).toBe('USD')
      expect(r.data.months).toBe(10)
      expect(r.data.due_day).toBe(5)
      expect(r.data.late_fee_percentage).toBe('5.00')
      expect(r.data.late_fee_after_days).toBe(10)
      expect(r.data.is_active).toBe(true)
    }
  })
  it('rejects missing monthly_amount', () => {
    expect(createPlanSchema.safeParse({ name: 'Plan' }).success).toBe(false)
  })
  it('rejects months below 1', () => {
    expect(createPlanSchema.safeParse({ ...validPlan(), months: 0 }).success).toBe(false)
  })
  it('rejects months above 12', () => {
    expect(createPlanSchema.safeParse({ ...validPlan(), months: 13 }).success).toBe(false)
  })
  it('coerces months from string', () => {
    const r = createPlanSchema.safeParse({ ...validPlan(), months: '10' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.months).toBe(10)
  })
  it('rejects due_day above 28 (febrero safety — regla venezolana)', () => {
    expect(createPlanSchema.safeParse({ ...validPlan(), due_day: 29 }).success).toBe(false)
  })
  it('rejects due_day below 1', () => {
    expect(createPlanSchema.safeParse({ ...validPlan(), due_day: 0 }).success).toBe(false)
  })
  it('coerces due_day from string', () => {
    const r = createPlanSchema.safeParse({ ...validPlan(), due_day: '5' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.due_day).toBe(5)
  })
  it('rejects late_fee_after_days above 30', () => {
    expect(createPlanSchema.safeParse({ ...validPlan(), late_fee_after_days: 31 }).success).toBe(false)
  })
  it('accepts period_id and grade_level as null (general plan)', () => {
    expect(createPlanSchema.safeParse({ ...validPlan(), period_id: null, grade_level: null }).success).toBe(true)
  })
})

describe('updatePlanSchema', () => {
  it('accepts empty object', () => { expect(updatePlanSchema.safeParse({}).success).toBe(true) })
  it('accepts is_active update', () => {
    expect(updatePlanSchema.safeParse({ is_active: false }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// createChargeSchema
// ---------------------------------------------------------------------------
describe('createChargeSchema', () => {
  it('accepts minimal charge with defaults', () => {
    const r = createChargeSchema.safeParse(validCharge())
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.concept).toBe('mensualidad')
      expect(r.data.currency).toBe('USD')
      expect(r.data.status).toBe('pending')
    }
  })
  it('rejects non-UUID student_id', () => {
    expect(createChargeSchema.safeParse({ ...validCharge(), student_id: 'bad' }).success).toBe(false)
  })
  it('rejects invalid period_month', () => {
    expect(createChargeSchema.safeParse({ ...validCharge(), period_month: '2026-1' }).success).toBe(false)
  })
  it('accepts period_month "2026-01"', () => {
    expect(createChargeSchema.safeParse(validCharge()).success).toBe(true)
  })
  it('accepts due_date as plain string', () => {
    const r = createChargeSchema.safeParse(validCharge())
    expect(r.success).toBe(true)
    if (r.success) expect(typeof r.data.due_date).toBe('string')
  })
  it('accepts plan_id as null (ad-hoc charge)', () => {
    expect(createChargeSchema.safeParse({ ...validCharge(), plan_id: null }).success).toBe(true)
  })

  describe('concept enum — conceptos de cobro escolar venezolano', () => {
    const concepts = ['mensualidad', 'inscripcion', 'material', 'uniforme', 'transporte', 'evento', 'otro'] as const
    test.each(concepts)('accepts concept "%s"', (concept) => {
      expect(createChargeSchema.safeParse({ ...validCharge(), concept }).success).toBe(true)
    })
    it('rejects invalid concept', () => {
      expect(createChargeSchema.safeParse({ ...validCharge(), concept: 'actividad' }).success).toBe(false)
    })
  })

  describe('status enum', () => {
    const statuses = ['pending', 'partial', 'paid', 'overdue', 'waived', 'credited'] as const
    test.each(statuses)('accepts status "%s"', (status) => {
      expect(createChargeSchema.safeParse({ ...validCharge(), status }).success).toBe(true)
    })
    it('rejects invalid status', () => {
      expect(createChargeSchema.safeParse({ ...validCharge(), status: 'draft' }).success).toBe(false)
    })
  })
})

describe('updateChargeSchema', () => {
  // omits student_id
  it('accepts empty object', () => { expect(updateChargeSchema.safeParse({}).success).toBe(true) })
  it('accepts status update (pending → paid)', () => {
    expect(updateChargeSchema.safeParse({ status: 'paid' }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// createPaymentSchema
// ---------------------------------------------------------------------------
describe('createPaymentSchema', () => {
  it('accepts minimal payment', () => {
    expect(createPaymentSchema.safeParse(validPayment()).success).toBe(true)
  })
  it('rejects non-UUID charge_id', () => {
    expect(createPaymentSchema.safeParse({ ...validPayment(), charge_id: 'bad' }).success).toBe(false)
  })
  it('rejects non-UUID student_id', () => {
    expect(createPaymentSchema.safeParse({ ...validPayment(), student_id: 'bad' }).success).toBe(false)
  })
  it('rejects missing payment_date', () => {
    const { payment_date: _o, ...rest } = validPayment()
    expect(createPaymentSchema.safeParse(rest).success).toBe(false)
  })
  it('accepts exchange_rate for BCV/VES reporting', () => {
    const r = createPaymentSchema.safeParse({ ...validPayment(), exchange_rate: '36.45' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.exchange_rate).toBe('36.45')
  })
  it('accepts exchange_rate as null (USD payment)', () => {
    expect(createPaymentSchema.safeParse({ ...validPayment(), exchange_rate: null }).success).toBe(true)
  })
  it('accepts payment_method_code for pago móvil / zelle / transferencia', () => {
    const r = createPaymentSchema.safeParse({ ...validPayment(), payment_method_code: 'pago_movil' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.payment_method_code).toBe('pago_movil')
  })
  it('accepts representative_contact_id as null (parent not in system)', () => {
    expect(createPaymentSchema.safeParse({ ...validPayment(), representative_contact_id: null }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// createDiscountSchema
// ---------------------------------------------------------------------------
describe('createDiscountSchema', () => {
  it('accepts minimal discount with defaults', () => {
    const r = createDiscountSchema.safeParse(validDiscount())
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.is_active).toBe(true)
  })
  it('rejects non-UUID student_id', () => {
    expect(createDiscountSchema.safeParse({ ...validDiscount(), student_id: 'bad' }).success).toBe(false)
  })
  it('rejects empty reason', () => {
    expect(createDiscountSchema.safeParse({ ...validDiscount(), reason: '' }).success).toBe(false)
  })
  it('accepts percentage discount', () => {
    const r = createDiscountSchema.safeParse({ ...validDiscount(), percentage: '10.00' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.percentage).toBe('10.00')
  })
  it('accepts fixed_amount discount', () => {
    expect(createDiscountSchema.safeParse({ ...validDiscount(), fixed_amount: '15.00' }).success).toBe(true)
  })
  it('accepts both percentage and fixed_amount as null', () => {
    expect(createDiscountSchema.safeParse({ ...validDiscount(), percentage: null, fixed_amount: null }).success).toBe(true)
  })
  it('accepts valid_from and valid_until as plain strings', () => {
    const r = createDiscountSchema.safeParse({
      ...validDiscount(), valid_from: '2025-09-01', valid_until: '2026-07-31',
    })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.valid_from).toBe('2025-09-01')
  })

  describe('discount_type enum', () => {
    const types = ['sibling', 'scholarship', 'employee', 'early_payment', 'other'] as const
    test.each(types)('accepts discount_type "%s"', (discount_type) => {
      expect(createDiscountSchema.safeParse({ ...validDiscount(), discount_type }).success).toBe(true)
    })
    it('rejects invalid discount_type', () => {
      expect(createDiscountSchema.safeParse({ ...validDiscount(), discount_type: 'loyalty' }).success).toBe(false)
    })
  })
})

describe('updateDiscountSchema', () => {
  // omits student_id
  it('accepts empty object', () => { expect(updateDiscountSchema.safeParse({}).success).toBe(true) })
  it('accepts is_active update', () => {
    expect(updateDiscountSchema.safeParse({ is_active: false }).success).toBe(true)
  })
  it('accepts percentage update', () => {
    expect(updateDiscountSchema.safeParse({ percentage: '15.00' }).success).toBe(true)
  })
})
