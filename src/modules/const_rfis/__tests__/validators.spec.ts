/**
 * Unit tests — const_rfis validators
 *
 * Covers the Zod schemas for RFIs (Requests for Information), RFI answers,
 * and submittals used in the Construction RFIs vertical.
 *
 * Venezuelan construction RFI/submittal context:
 *   - RFIs (Solicitudes de Información): formal written queries to designer/
 *     engineer — required for contract modification claims (CONAVI, MINVIH)
 *   - schedule_impact_days: días de impacto al cronograma — documented for
 *     EOT (Extension of Time) claims under Venezuelan contract law
 *   - cost_impact: impacto de costo — basis for adicionales de obra (change
 *     orders) — requires written approval from ente contratante
 *   - submittal 'approved_as_noted': aprobado con observaciones — common
 *     response in Venezuelan municipal engineering offices
 *   - submittal 'revise_resubmit': revisar y re-consignar — requires new
 *     revision_number increment
 *   - discipline 'structural': ingeniería estructural — requires INAVI/INN
 *     review for residential buildings in Venezuela
 *   - priority 'urgent': para RFIs que detienen avance de obra (stop-work)
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 *
 * Reference: https://docs.open-mercato.dev/framework/api/api-development-guide
 */

import {
  createRFISchema,
  updateRFISchema,
  answerRFISchema,
  createSubmittalSchema,
  updateSubmittalSchema,
} from '../data/validators'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const UUID = '11111111-1111-4111-8111-111111111111'

/** Minimal valid RFI payload. */
const validRFI = () => ({
  project_id: UUID,
  subject: 'Aclaración de detalle estructural en columna C-12',
  description: 'El plano E-04 Rev.2 muestra armado diferente al especificado en memorias. Confirmar dimensión de estribo.',
  submitted_by: 'Ing. Martínez - Constructora',
})

/** Minimal valid RFI answer payload. */
const validAnswer = () => ({
  rfi_id: UUID,
  answer: 'Usar estribos #3@15cm conforme a memoria de cálculo MC-2026-003. Plano corregido adjunto.',
})

/** Minimal valid submittal payload. */
const validSubmittal = () => ({
  project_id: UUID,
  title: 'Shop Drawing — Estructura metálica cubierta',
  submitted_by: 'Ing. Torres - Taller Metálico',
})

// ---------------------------------------------------------------------------
// createRFISchema
// ---------------------------------------------------------------------------

describe('createRFISchema', () => {
  describe('required fields and defaults', () => {
    it('accepts a minimal valid RFI with defaults', () => {
      const result = createRFISchema.safeParse(validRFI())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.discipline).toBe('civil')
        expect(result.data.priority).toBe('normal')
        expect(result.data.status).toBe('open')
      }
    })

    it('rejects when project_id is not a UUID', () => {
      expect(createRFISchema.safeParse({ ...validRFI(), project_id: 'bad' }).success).toBe(false)
    })

    it('rejects when subject is missing', () => {
      const { subject: _omit, ...rest } = validRFI()
      expect(createRFISchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when description is empty', () => {
      expect(createRFISchema.safeParse({ ...validRFI(), description: '' }).success).toBe(false)
    })

    it('rejects when submitted_by is missing', () => {
      const { submitted_by: _omit, ...rest } = validRFI()
      expect(createRFISchema.safeParse(rest).success).toBe(false)
    })

    it('accepts cost_impact as a USD amount string', () => {
      const result = createRFISchema.safeParse({
        ...validRFI(),
        cost_impact: '4500.00',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.cost_impact).toBe('4500.00')
      }
    })

    it('accepts cost_impact as null (no cost impact identified)', () => {
      expect(createRFISchema.safeParse({ ...validRFI(), cost_impact: null }).success).toBe(true)
    })

    it('accepts schedule_impact_days coerced from string', () => {
      const result = createRFISchema.safeParse({
        ...validRFI(),
        schedule_impact_days: '7',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.schedule_impact_days).toBe(7)
      }
    })

    it('accepts schedule_impact_days as null (no schedule impact)', () => {
      expect(createRFISchema.safeParse({ ...validRFI(), schedule_impact_days: null }).success).toBe(true)
    })

    it('accepts due_date as a plain date string', () => {
      const result = createRFISchema.safeParse({
        ...validRFI(),
        due_date: '2026-02-10',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.due_date).toBe('2026-02-10')
      }
    })

    it('accepts assigned_to and linked_drawing as null', () => {
      expect(
        createRFISchema.safeParse({
          ...validRFI(),
          assigned_to: null,
          linked_drawing: null,
        }).success
      ).toBe(true)
    })
  })

  describe('discipline enum', () => {
    const disciplines = ['civil', 'architectural', 'structural', 'electrical', 'mechanical', 'plumbing', 'other'] as const

    test.each(disciplines)('accepts discipline "%s"', (discipline) => {
      expect(createRFISchema.safeParse({ ...validRFI(), discipline }).success).toBe(true)
    })

    it('rejects an invalid discipline', () => {
      expect(createRFISchema.safeParse({ ...validRFI(), discipline: 'hvac' }).success).toBe(false)
    })
  })

  describe('priority enum', () => {
    const priorities = ['low', 'normal', 'high', 'urgent'] as const

    test.each(priorities)('accepts priority "%s"', (priority) => {
      expect(createRFISchema.safeParse({ ...validRFI(), priority }).success).toBe(true)
    })

    it('rejects an invalid priority', () => {
      expect(createRFISchema.safeParse({ ...validRFI(), priority: 'critical' }).success).toBe(false)
    })
  })

  describe('status enum', () => {
    const statuses = ['open', 'pending_response', 'answered', 'closed', 'void'] as const

    test.each(statuses)('accepts status "%s"', (status) => {
      expect(createRFISchema.safeParse({ ...validRFI(), status }).success).toBe(true)
    })

    it('rejects an invalid status', () => {
      expect(createRFISchema.safeParse({ ...validRFI(), status: 'draft' }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// updateRFISchema
// ---------------------------------------------------------------------------

describe('updateRFISchema', () => {
  it('accepts an empty object', () => {
    expect(updateRFISchema.safeParse({}).success).toBe(true)
  })

  it('accepts a status-only update (open → pending_response)', () => {
    expect(updateRFISchema.safeParse({ status: 'pending_response' }).success).toBe(true)
  })

  it('still rejects invalid discipline in partial update', () => {
    expect(updateRFISchema.safeParse({ discipline: 'hvac' }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// answerRFISchema
// ---------------------------------------------------------------------------

describe('answerRFISchema', () => {
  it('accepts a minimal valid RFI answer', () => {
    expect(answerRFISchema.safeParse(validAnswer()).success).toBe(true)
  })

  it('rejects when rfi_id is not a UUID', () => {
    expect(answerRFISchema.safeParse({ ...validAnswer(), rfi_id: 'bad' }).success).toBe(false)
  })

  it('rejects when answer is empty', () => {
    expect(answerRFISchema.safeParse({ ...validAnswer(), answer: '' }).success).toBe(false)
  })

  it('accepts cost_impact as null (no cost impact confirmed)', () => {
    expect(answerRFISchema.safeParse({ ...validAnswer(), cost_impact: null }).success).toBe(true)
  })

  it('accepts schedule_impact_days coerced from string', () => {
    const result = answerRFISchema.safeParse({
      ...validAnswer(),
      schedule_impact_days: '3',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.schedule_impact_days).toBe(3)
    }
  })

  it('accepts schedule_impact_days as null', () => {
    expect(answerRFISchema.safeParse({ ...validAnswer(), schedule_impact_days: null }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// createSubmittalSchema
// ---------------------------------------------------------------------------

describe('createSubmittalSchema', () => {
  describe('required fields and defaults', () => {
    it('accepts a minimal valid submittal with defaults', () => {
      const result = createSubmittalSchema.safeParse(validSubmittal())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.submittal_type).toBe('product_data')
        expect(result.data.status).toBe('draft')
        expect(result.data.revision_number).toBe(1)
      }
    })

    it('rejects when project_id is not a UUID', () => {
      expect(createSubmittalSchema.safeParse({ ...validSubmittal(), project_id: 'bad' }).success).toBe(false)
    })

    it('rejects when title is missing', () => {
      const { title: _omit, ...rest } = validSubmittal()
      expect(createSubmittalSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when submitted_by is missing', () => {
      const { submitted_by: _omit, ...rest } = validSubmittal()
      expect(createSubmittalSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects revision_number below 1', () => {
      expect(createSubmittalSchema.safeParse({ ...validSubmittal(), revision_number: 0 }).success).toBe(false)
    })

    it('coerces revision_number from string', () => {
      const result = createSubmittalSchema.safeParse({ ...validSubmittal(), revision_number: '2' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.revision_number).toBe(2)
      }
    })

    it('accepts reviewer and spec_section as null', () => {
      expect(
        createSubmittalSchema.safeParse({
          ...validSubmittal(),
          reviewer: null,
          spec_section: null,
        }).success
      ).toBe(true)
    })

    it('accepts submitted_at and due_date as plain strings', () => {
      const result = createSubmittalSchema.safeParse({
        ...validSubmittal(),
        submitted_at: '2026-02-01',
        due_date: '2026-02-15',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.submitted_at).toBe('2026-02-01')
      }
    })
  })

  describe('submittal_type enum', () => {
    const types = ['shop_drawing', 'product_data', 'sample', 'calculation', 'certificate', 'test_report'] as const

    test.each(types)('accepts submittal_type "%s"', (submittal_type) => {
      expect(createSubmittalSchema.safeParse({ ...validSubmittal(), submittal_type }).success).toBe(true)
    })

    it('rejects an invalid submittal_type', () => {
      expect(createSubmittalSchema.safeParse({ ...validSubmittal(), submittal_type: 'warranty' }).success).toBe(false)
    })
  })

  describe('status enum', () => {
    const statuses = [
      'draft', 'submitted', 'under_review', 'approved',
      'approved_as_noted', 'revise_resubmit', 'rejected',
    ] as const

    test.each(statuses)('accepts status "%s"', (status) => {
      expect(createSubmittalSchema.safeParse({ ...validSubmittal(), status }).success).toBe(true)
    })

    it('rejects an invalid status', () => {
      expect(createSubmittalSchema.safeParse({ ...validSubmittal(), status: 'void' }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// updateSubmittalSchema
// ---------------------------------------------------------------------------

describe('updateSubmittalSchema', () => {
  it('accepts an empty object', () => {
    expect(updateSubmittalSchema.safeParse({}).success).toBe(true)
  })

  it('accepts a status-only update (under_review → approved_as_noted)', () => {
    expect(updateSubmittalSchema.safeParse({ status: 'approved_as_noted' }).success).toBe(true)
  })

  it('accepts revision_number increment for revise_resubmit', () => {
    expect(updateSubmittalSchema.safeParse({ status: 'revise_resubmit', revision_number: 2 }).success).toBe(true)
  })
})
