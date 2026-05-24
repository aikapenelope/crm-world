/**
 * Unit tests — agri_hr validators
 *
 * Cubre los schemas Zod para nómina agrícola: empleados (fijos/jornaleros/
 * destajeros), nóminas con provisiones LOTTT y liquidaciones de productores
 * integrados.
 *
 * Contexto venezolano — LOTTT (Ley Orgánica del Trabajo, Trabajadores y Trabajadoras):
 *   - employee_type 'jornalero': pago diario, se calcula semana a semana.
 *   - employee_type 'destajero': pago por unidad producida (kg, cajas, aves, etc.).
 *   - Provisiones LOTTT obligatorias en cada nómina:
 *     - vacation_provision_usd:   vacaciones (15 días/año = 1.25 días/mes)
 *     - bonus_provision_usd:      bono de fin de año (utilidades mínimas 15 días)
 *     - severance_provision_usd:  prestaciones sociales (30 días/año progresivos)
 *   - ProducerSettlement: liquidación del productor integrado al completar el ciclo.
 *     Se paga por KG producido × precio base, con bonos/penalidades por FCA y peso.
 *     El worker on-flock-completed la crea automáticamente.
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 */

import {
  employeeCreateSchema,
  employeeUpdateSchema,
  jornaleroPayrollCreateSchema,
  jornaleroPayrollUpdateSchema,
  producerSettlementCreateSchema,
  producerSettlementUpdateSchema,
} from '../data/validators'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const UUID  = '11111111-1111-4111-8111-111111111111'
const UUID2 = '22222222-2222-4222-8222-222222222222'
const UUID3 = '33333333-3333-4333-8333-333333333333'

const validEmployee = () => ({
  first_name: 'Pedro',
  last_name:  'Martínez',
  hire_date:  new Date('2024-03-01'),
})

const validPayroll = () => ({
  employee_id:  UUID,
  period_start: new Date('2026-01-01'),
  period_end:   new Date('2026-01-07'),
  gross_usd:    '35.00',
  net_usd:      '35.00',
})

const validSettlement = () => ({
  producer_id:          UUID,
  farm_unit_id:         UUID2,
  flock_id:             UUID3,
  cycle_start_date:     new Date('2025-12-01'),
  cycle_end_date:       new Date('2026-01-15'),
  initial_birds:        18000,
  final_birds:          17400,
  actual_fca:           '1.87',
  actual_avg_weight_kg: '2.35',
  actual_mortality_pct: '3.33',
  target_fca:           '1.90',
  target_weight_kg:     '2.30',
  price_per_kg_usd:     '0.85',
  base_payment_usd:     '34750.50',
  total_payment_usd:    '36000.00',
})

// ---------------------------------------------------------------------------
// employeeCreateSchema
// ---------------------------------------------------------------------------

describe('employeeCreateSchema', () => {
  describe('required fields', () => {
    it('accepts a minimal valid employee with defaults', () => {
      const result = employeeCreateSchema.safeParse(validEmployee())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.employee_type).toBe('fixed')
        expect(result.data.status).toBe('active')
      }
    })

    it('rejects when first_name is missing', () => {
      const { first_name: _omit, ...rest } = validEmployee()
      expect(employeeCreateSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when last_name is missing', () => {
      const { last_name: _omit, ...rest } = validEmployee()
      expect(employeeCreateSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when hire_date is missing', () => {
      const { hire_date: _omit, ...rest } = validEmployee()
      expect(employeeCreateSchema.safeParse(rest).success).toBe(false)
    })
  })

  describe('employee_type enum — LOTTT', () => {
    it('accepts "fixed" (empleado fijo mensual)', () => {
      const result = employeeCreateSchema.safeParse({
        ...validEmployee(), employee_type: 'fixed', salary_usd: '200.00',
      })
      expect(result.success).toBe(true)
    })

    it('accepts "jornalero" (pago diario)', () => {
      const result = employeeCreateSchema.safeParse({
        ...validEmployee(), employee_type: 'jornalero', base_jornal_usd: '5.00',
      })
      expect(result.success).toBe(true)
    })

    it('accepts "destajero" (pago por unidad producida)', () => {
      const result = employeeCreateSchema.safeParse({
        ...validEmployee(), employee_type: 'destajero',
        base_destajo_usd: '0.02', destajo_unit: 'bird',
      })
      expect(result.success).toBe(true)
    })

    it('rejects invalid employee_type', () => {
      expect(employeeCreateSchema.safeParse({ ...validEmployee(), employee_type: 'contratado' }).success).toBe(false)
    })
  })

  describe('destajo_unit enum', () => {
    const units = ['ton', 'box', 'bird', 'hour', 'kg'] as const

    test.each(units)('accepts destajo_unit "%s"', (destajo_unit) => {
      expect(employeeCreateSchema.safeParse({
        ...validEmployee(), employee_type: 'destajero', destajo_unit,
      }).success).toBe(true)
    })

    it('rejects invalid destajo_unit', () => {
      expect(employeeCreateSchema.safeParse({
        ...validEmployee(), destajo_unit: 'dozen',
      }).success).toBe(false)
    })
  })

  describe('status enum', () => {
    const statuses = ['active', 'inactive', 'terminated'] as const

    test.each(statuses)('accepts status "%s"', (status) => {
      expect(employeeCreateSchema.safeParse({ ...validEmployee(), status }).success).toBe(true)
    })

    it('rejects invalid status', () => {
      expect(employeeCreateSchema.safeParse({ ...validEmployee(), status: 'suspended' }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// employeeUpdateSchema
// ---------------------------------------------------------------------------

describe('employeeUpdateSchema', () => {
  it('accepts an empty object', () => {
    expect(employeeUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('still validates employee_type enum on partial update', () => {
    expect(employeeUpdateSchema.safeParse({ employee_type: 'freelance' }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// jornaleroPayrollCreateSchema — nómina con provisiones LOTTT
// ---------------------------------------------------------------------------

describe('jornaleroPayrollCreateSchema', () => {
  describe('required fields', () => {
    it('accepts a minimal valid payroll with defaults', () => {
      const result = jornaleroPayrollCreateSchema.safeParse(validPayroll())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('draft')
      }
    })

    const required = ['employee_id', 'period_start', 'period_end', 'gross_usd', 'net_usd'] as const

    test.each(required)('rejects when %s is missing', (field) => {
      const p = { ...validPayroll() }
      delete (p as Record<string, unknown>)[field]
      expect(jornaleroPayrollCreateSchema.safeParse(p).success).toBe(false)
    })

    it('rejects non-UUID employee_id', () => {
      expect(jornaleroPayrollCreateSchema.safeParse({ ...validPayroll(), employee_id: 'bad' }).success).toBe(false)
    })
  })

  describe('LOTTT provisions', () => {
    it('accepts full nómina with all three LOTTT provisions', () => {
      const result = jornaleroPayrollCreateSchema.safeParse({
        ...validPayroll(),
        days_worked: 7,
        gross_usd: '35.00',
        vacation_provision_usd: '1.46',    // 15 días/año proporcional
        bonus_provision_usd: '1.46',       // utilidades mínimas 15 días
        severance_provision_usd: '2.92',   // prestaciones sociales 30 días/año
        total_provisions_usd: '5.84',
        net_usd: '35.00',
        status: 'draft',
      })
      expect(result.success).toBe(true)
    })

    it('accepts payroll without provisions (simplified, to be detailed later)', () => {
      expect(jornaleroPayrollCreateSchema.safeParse(validPayroll()).success).toBe(true)
    })
  })

  describe('status lifecycle', () => {
    const statuses = ['draft', 'approved', 'paid'] as const

    test.each(statuses)('accepts status "%s"', (status) => {
      expect(jornaleroPayrollCreateSchema.safeParse({ ...validPayroll(), status }).success).toBe(true)
    })

    it('rejects invalid status', () => {
      expect(jornaleroPayrollCreateSchema.safeParse({ ...validPayroll(), status: 'cancelled' }).success).toBe(false)
    })
  })

  describe('days_worked and units_worked', () => {
    it('accepts days_worked = 0 (semana sin trabajo)', () => {
      expect(jornaleroPayrollCreateSchema.safeParse({ ...validPayroll(), days_worked: 0 }).success).toBe(true)
    })

    it('rejects negative days_worked', () => {
      expect(jornaleroPayrollCreateSchema.safeParse({ ...validPayroll(), days_worked: -1 }).success).toBe(false)
    })

    it('accepts units_worked for destajeros', () => {
      expect(jornaleroPayrollCreateSchema.safeParse({ ...validPayroll(), units_worked: '3500' }).success).toBe(true)
    })
  })
})

// ---------------------------------------------------------------------------
// jornaleroPayrollUpdateSchema
// ---------------------------------------------------------------------------

describe('jornaleroPayrollUpdateSchema', () => {
  it('accepts an empty object', () => {
    expect(jornaleroPayrollUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('accepts status approval', () => {
    expect(jornaleroPayrollUpdateSchema.safeParse({ status: 'approved' }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// producerSettlementCreateSchema — liquidación ciclo integrado
// ---------------------------------------------------------------------------

describe('producerSettlementCreateSchema', () => {
  describe('required fields', () => {
    it('accepts a minimal valid settlement with defaults', () => {
      const result = producerSettlementCreateSchema.safeParse(validSettlement())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('calculated')
      }
    })

    const required = ['producer_id', 'farm_unit_id', 'flock_id', 'cycle_start_date',
      'cycle_end_date', 'initial_birds', 'final_birds', 'actual_fca',
      'actual_avg_weight_kg', 'actual_mortality_pct', 'target_fca',
      'target_weight_kg', 'price_per_kg_usd', 'base_payment_usd', 'total_payment_usd'] as const

    test.each(required)('rejects when %s is missing', (field) => {
      const p = { ...validSettlement() }
      delete (p as Record<string, unknown>)[field]
      expect(producerSettlementCreateSchema.safeParse(p).success).toBe(false)
    })
  })

  describe('bird counts', () => {
    it('rejects initial_birds = 0', () => {
      expect(producerSettlementCreateSchema.safeParse({ ...validSettlement(), initial_birds: 0 }).success).toBe(false)
    })

    it('accepts final_birds = 0 (mortalidad total — caso extremo)', () => {
      expect(producerSettlementCreateSchema.safeParse({ ...validSettlement(), final_birds: 0 }).success).toBe(true)
    })

    it('rejects negative final_birds', () => {
      expect(producerSettlementCreateSchema.safeParse({ ...validSettlement(), final_birds: -1 }).success).toBe(false)
    })
  })

  describe('status lifecycle', () => {
    const statuses = ['calculated', 'approved', 'paid'] as const

    test.each(statuses)('accepts status "%s"', (status) => {
      expect(producerSettlementCreateSchema.safeParse({ ...validSettlement(), status }).success).toBe(true)
    })

    it('rejects invalid status', () => {
      expect(producerSettlementCreateSchema.safeParse({ ...validSettlement(), status: 'cancelled' }).success).toBe(false)
    })
  })

  describe('FCA bonus/penalty fields', () => {
    it('accepts fca_bonus_usd when FCA is better than target', () => {
      const result = producerSettlementCreateSchema.safeParse({
        ...validSettlement(),
        actual_fca: '1.82',
        fca_bonus_usd: '875.00',
        total_payment_usd: '36875.00',
      })
      expect(result.success).toBe(true)
    })

    it('accepts fca_penalty_usd when FCA exceeds target significantly', () => {
      const result = producerSettlementCreateSchema.safeParse({
        ...validSettlement(),
        actual_fca: '2.10',
        fca_penalty_usd: '1400.00',
        total_payment_usd: '33350.50',
      })
      expect(result.success).toBe(true)
    })
  })
})

// ---------------------------------------------------------------------------
// producerSettlementUpdateSchema
// ---------------------------------------------------------------------------

describe('producerSettlementUpdateSchema', () => {
  it('accepts an empty object', () => {
    expect(producerSettlementUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('accepts status approval after technician review', () => {
    expect(producerSettlementUpdateSchema.safeParse({ status: 'approved' }).success).toBe(true)
  })
})
