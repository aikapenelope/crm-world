/**
 * Unit tests — const_subcon validators
 *
 * Covers the Zod schemas for subcontractors, subcontracts, and subcontractor
 * payments used in the Construction Subcontracting vertical.
 *
 * Venezuelan construction subcontracting context:
 *   - rif: RIF del subcontratista — required for SENIAT fiscal compliance and
 *     IGTF on USD payments (Ley de IGTF applies if paid in foreign currency)
 *   - retention_percent default '10.00': retención de garantía exigida por
 *     contratos públicos (Ley de Contrataciones Públicas Art. 126)
 *   - currency default 'USD': subcontract amounts in USD for price stability
 *     (Venezuelan hyperinflation makes Bolívar contracts impractical)
 *   - status 'terminated': rescisión del contrato — requires causa legal;
 *     used when subcontractor abandons work (incumplimiento)
 *   - rating: calificación del subcontratista (1–5 stars) — drives re-hire
 *     decisions on future projects
 *   - createPaymentSchema: pago a subcontratista — gross_amount less
 *     retention_amount equals net_amount (standard Venezuelan payment cert)
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 *
 * Reference: https://docs.open-mercato.dev/framework/api/api-development-guide
 */

import {
  createSubcontractorSchema,
  updateSubcontractorSchema,
  createSubcontractSchema,
  updateSubcontractSchema,
  createPaymentSchema,
  updatePaymentSchema,
} from '../data/validators'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const UUID = '11111111-1111-4111-8111-111111111111'

/** Minimal valid subcontractor payload. */
const validSubcontractor = () => ({
  name: 'Estructuras Metálicas del Sur C.A.',
  specialty: 'steel' as const,
})

/** Minimal valid subcontract payload. */
const validSubcontract = () => ({
  project_id: UUID,
  subcontractor_id: UUID,
  subcontractor_name: 'Estructuras Metálicas del Sur C.A.',
  contract_number: 'SUB-2026-001',
  scope_description: 'Fabricación e instalación de estructura metálica de cubierta',
  contract_amount: '125000.00',
})

/** Minimal valid payment payload. */
const validPayment = () => ({
  subcontract_id: UUID,
  period_description: 'Valuación #1 — Enero 2026',
  gross_amount: '25000.00',
  retention_amount: '2500.00',
  net_amount: '22500.00',
})

// ---------------------------------------------------------------------------
// createSubcontractorSchema
// ---------------------------------------------------------------------------

describe('createSubcontractorSchema', () => {
  describe('required fields and defaults', () => {
    it('accepts a minimal valid subcontractor with defaults', () => {
      const result = createSubcontractorSchema.safeParse(validSubcontractor())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.is_active).toBe(true)
      }
    })

    it('rejects when name is missing', () => {
      const { name: _omit, ...rest } = validSubcontractor()
      expect(createSubcontractorSchema.safeParse(rest).success).toBe(false)
    })

    it('accepts rif as null (unregistered / informal subcontractor)', () => {
      expect(createSubcontractorSchema.safeParse({ ...validSubcontractor(), rif: null }).success).toBe(true)
    })

    it('accepts rif for SENIAT compliance', () => {
      const result = createSubcontractorSchema.safeParse({
        ...validSubcontractor(),
        rif: 'J-40123456-7',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.rif).toBe('J-40123456-7')
      }
    })

    it('rejects rating below 1', () => {
      expect(createSubcontractorSchema.safeParse({ ...validSubcontractor(), rating: 0 }).success).toBe(false)
    })

    it('rejects rating above 5', () => {
      expect(createSubcontractorSchema.safeParse({ ...validSubcontractor(), rating: 6 }).success).toBe(false)
    })

    it('accepts rating as null (not yet rated)', () => {
      expect(createSubcontractorSchema.safeParse({ ...validSubcontractor(), rating: null }).success).toBe(true)
    })

    it('coerces rating from string', () => {
      const result = createSubcontractorSchema.safeParse({ ...validSubcontractor(), rating: '4' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.rating).toBe(4)
      }
    })

    it('accepts optional contact fields as null', () => {
      expect(
        createSubcontractorSchema.safeParse({
          ...validSubcontractor(),
          contact_name: null,
          phone: null,
          email: null,
          notes: null,
        }).success
      ).toBe(true)
    })
  })

  describe('specialty enum', () => {
    const specialties = [
      'excavation', 'concrete', 'steel', 'masonry', 'electrical',
      'mechanical', 'plumbing', 'hvac', 'finishing', 'landscaping', 'other',
    ] as const

    test.each(specialties)('accepts specialty "%s"', (specialty) => {
      expect(createSubcontractorSchema.safeParse({ ...validSubcontractor(), specialty }).success).toBe(true)
    })

    it('rejects an invalid specialty', () => {
      expect(createSubcontractorSchema.safeParse({ ...validSubcontractor(), specialty: 'roofing' }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// updateSubcontractorSchema
// ---------------------------------------------------------------------------

describe('updateSubcontractorSchema', () => {
  it('accepts an empty object', () => {
    expect(updateSubcontractorSchema.safeParse({}).success).toBe(true)
  })

  it('accepts rating-only update after project completion', () => {
    expect(updateSubcontractorSchema.safeParse({ rating: 4 }).success).toBe(true)
  })

  it('accepts is_active-only update (deactivating subcontractor)', () => {
    expect(updateSubcontractorSchema.safeParse({ is_active: false }).success).toBe(true)
  })

  it('still rejects invalid specialty in partial update', () => {
    expect(updateSubcontractorSchema.safeParse({ specialty: 'roofing' }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// createSubcontractSchema
// ---------------------------------------------------------------------------

describe('createSubcontractSchema', () => {
  describe('required fields and defaults', () => {
    it('accepts a minimal valid subcontract with defaults', () => {
      const result = createSubcontractSchema.safeParse(validSubcontract())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.retention_percent).toBe('10.00')
        expect(result.data.currency).toBe('USD')
        expect(result.data.status).toBe('draft')
      }
    })

    it('rejects when project_id is not a UUID', () => {
      expect(createSubcontractSchema.safeParse({ ...validSubcontract(), project_id: 'bad' }).success).toBe(false)
    })

    it('rejects when subcontractor_id is not a UUID', () => {
      expect(createSubcontractSchema.safeParse({ ...validSubcontract(), subcontractor_id: 'bad' }).success).toBe(false)
    })

    it('rejects when contract_number is missing', () => {
      const { contract_number: _omit, ...rest } = validSubcontract()
      expect(createSubcontractSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when scope_description is empty', () => {
      expect(createSubcontractSchema.safeParse({ ...validSubcontract(), scope_description: '' }).success).toBe(false)
    })

    it('rejects when contract_amount is missing', () => {
      const { contract_amount: _omit, ...rest } = validSubcontract()
      expect(createSubcontractSchema.safeParse(rest).success).toBe(false)
    })

    it('accepts retention_percent set to 10% (Ley de Contrataciones Públicas)', () => {
      const result = createSubcontractSchema.safeParse({
        ...validSubcontract(),
        retention_percent: '10.00',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.retention_percent).toBe('10.00')
      }
    })

    it('accepts start_date and end_date as plain strings', () => {
      const result = createSubcontractSchema.safeParse({
        ...validSubcontract(),
        start_date: '2026-02-01',
        end_date: '2026-08-31',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.start_date).toBe('2026-02-01')
      }
    })

    it('accepts start_date and end_date as null (dates TBD)', () => {
      expect(
        createSubcontractSchema.safeParse({
          ...validSubcontract(),
          start_date: null,
          end_date: null,
        }).success
      ).toBe(true)
    })
  })

  describe('status enum', () => {
    const statuses = ['draft', 'active', 'completed', 'terminated'] as const

    test.each(statuses)('accepts status "%s"', (status) => {
      expect(createSubcontractSchema.safeParse({ ...validSubcontract(), status }).success).toBe(true)
    })

    it('rejects an invalid status', () => {
      expect(createSubcontractSchema.safeParse({ ...validSubcontract(), status: 'cancelled' }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// updateSubcontractSchema
// ---------------------------------------------------------------------------

describe('updateSubcontractSchema', () => {
  it('accepts an empty object', () => {
    expect(updateSubcontractSchema.safeParse({}).success).toBe(true)
  })

  it('accepts a status-only update (draft → active)', () => {
    expect(updateSubcontractSchema.safeParse({ status: 'active' }).success).toBe(true)
  })

  it('still rejects invalid status in partial update', () => {
    expect(updateSubcontractSchema.safeParse({ status: 'cancelled' }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// createPaymentSchema — pago a subcontratista
// ---------------------------------------------------------------------------

describe('createPaymentSchema', () => {
  describe('required fields and defaults', () => {
    it('accepts a minimal valid payment with defaults', () => {
      const result = createPaymentSchema.safeParse(validPayment())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('pending')
      }
    })

    it('rejects when subcontract_id is not a UUID', () => {
      expect(createPaymentSchema.safeParse({ ...validPayment(), subcontract_id: 'bad' }).success).toBe(false)
    })

    it('rejects when period_description is missing', () => {
      const { period_description: _omit, ...rest } = validPayment()
      expect(createPaymentSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when gross_amount is missing', () => {
      const { gross_amount: _omit, ...rest } = validPayment()
      expect(createPaymentSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when retention_amount is missing', () => {
      const { retention_amount: _omit, ...rest } = validPayment()
      expect(createPaymentSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when net_amount is missing', () => {
      const { net_amount: _omit, ...rest } = validPayment()
      expect(createPaymentSchema.safeParse(rest).success).toBe(false)
    })

    it('accepts payment_date as plain string', () => {
      const result = createPaymentSchema.safeParse({
        ...validPayment(),
        payment_date: '2026-02-15',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.payment_date).toBe('2026-02-15')
      }
    })

    it('accepts payment_date as null (not yet paid)', () => {
      expect(createPaymentSchema.safeParse({ ...validPayment(), payment_date: null }).success).toBe(true)
    })
  })

  describe('status enum', () => {
    const statuses = ['pending', 'approved', 'paid'] as const

    test.each(statuses)('accepts status "%s"', (status) => {
      expect(createPaymentSchema.safeParse({ ...validPayment(), status }).success).toBe(true)
    })

    it('rejects an invalid status', () => {
      expect(createPaymentSchema.safeParse({ ...validPayment(), status: 'rejected' }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// updatePaymentSchema
// ---------------------------------------------------------------------------

describe('updatePaymentSchema', () => {
  it('accepts an empty object', () => {
    expect(updatePaymentSchema.safeParse({}).success).toBe(true)
  })

  it('accepts a status-only update (pending → approved)', () => {
    expect(updatePaymentSchema.safeParse({ status: 'approved' }).success).toBe(true)
  })

  it('accepts payment_date update on actual payment', () => {
    expect(
      updatePaymentSchema.safeParse({ status: 'paid', payment_date: '2026-02-20' }).success
    ).toBe(true)
  })

  it('still rejects invalid status in partial update', () => {
    expect(updatePaymentSchema.safeParse({ status: 'rejected' }).success).toBe(false)
  })
})
