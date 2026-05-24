/**
 * Unit tests — const_projects validators
 *
 * Covers the Zod schemas for construction project creation, updates, and list
 * queries used in the Construction vertical.
 *
 * Venezuelan construction context:
 *   - retention_percent default '10.00': retención de garantía (10%) mandated
 *     by Ley de Contrataciones Públicas for public-sector projects
 *   - client_type 'public': PDVSA, gobernaciones, alcaldías — payment delays
 *     common; requires retención compliance tracking
 *   - contract_type 'cost_plus': frequently used in inflationary environments
 *     where fixed-price contracts are unviable (hyperinflation context)
 *   - currency default 'USD': construction contracts denominated in USD to
 *     hedge against Bolívar devaluation; bcv_rate applied at payment
 *   - project status 'bidding': licitación stage (government tender)
 *   - Dates stored as plain strings (not Date objects) — flexible for
 *     construction scheduling across timezone-naive environments
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 *
 * Reference: https://docs.open-mercato.dev/framework/api/api-development-guide
 */

import {
  createProjectSchema,
  updateProjectSchema,
  listProjectsSchema,
} from '../data/validators'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal valid project payload. */
const validProject = () => ({
  name: 'Edificio Residencial Las Palmas',
  code: 'PRJ-2026-001',
  project_type: 'residential' as const,
  client_name: 'Inversiones Andina C.A.',
  contract_type: 'fixed_price' as const,
  contract_amount: '850000.00',
})

// ---------------------------------------------------------------------------
// createProjectSchema
// ---------------------------------------------------------------------------

describe('createProjectSchema', () => {
  describe('required fields and defaults', () => {
    it('accepts a minimal valid project with defaults', () => {
      const result = createProjectSchema.safeParse(validProject())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('prospect')
        expect(result.data.client_type).toBe('private')
        expect(result.data.currency).toBe('USD')
        expect(result.data.advance_percent).toBe('0.00')
        expect(result.data.retention_percent).toBe('10.00')
      }
    })

    it('rejects when name is missing', () => {
      const { name: _omit, ...rest } = validProject()
      expect(createProjectSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when code is missing', () => {
      const { code: _omit, ...rest } = validProject()
      expect(createProjectSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when client_name is missing', () => {
      const { client_name: _omit, ...rest } = validProject()
      expect(createProjectSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when contract_amount is missing', () => {
      const { contract_amount: _omit, ...rest } = validProject()
      expect(createProjectSchema.safeParse(rest).success).toBe(false)
    })

    it('accepts client_id as null (walk-in client)', () => {
      expect(createProjectSchema.safeParse({ ...validProject(), client_id: null }).success).toBe(true)
    })

    it('accepts start_date as a plain date string', () => {
      const result = createProjectSchema.safeParse({
        ...validProject(),
        start_date: '2026-03-01',
        planned_end_date: '2027-03-01',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.start_date).toBe('2026-03-01')
        expect(result.data.planned_end_date).toBe('2027-03-01')
      }
    })

    it('accepts start_date as null (tender stage — dates TBD)', () => {
      expect(createProjectSchema.safeParse({ ...validProject(), start_date: null }).success).toBe(true)
    })

    it('accepts retention_percent set to 10% (Ley de Contrataciones Públicas)', () => {
      const result = createProjectSchema.safeParse({
        ...validProject(),
        client_type: 'public',
        retention_percent: '10.00',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.retention_percent).toBe('10.00')
      }
    })

    it('accepts all optional text fields as null', () => {
      expect(
        createProjectSchema.safeParse({
          ...validProject(),
          location: null,
          city: null,
          state: null,
          contract_number: null,
          project_manager: null,
          site_supervisor: null,
          description: null,
          notes: null,
        }).success
      ).toBe(true)
    })
  })

  describe('project_type enum', () => {
    const types = ['residential', 'commercial', 'infrastructure', 'industrial', 'renovation'] as const

    test.each(types)('accepts project_type "%s"', (project_type) => {
      expect(createProjectSchema.safeParse({ ...validProject(), project_type }).success).toBe(true)
    })

    it('rejects an invalid project_type', () => {
      expect(createProjectSchema.safeParse({ ...validProject(), project_type: 'mixed_use' }).success).toBe(false)
    })
  })

  describe('status enum', () => {
    const statuses = ['prospect', 'bidding', 'awarded', 'in_progress', 'on_hold', 'completed', 'cancelled'] as const

    test.each(statuses)('accepts status "%s"', (status) => {
      expect(createProjectSchema.safeParse({ ...validProject(), status }).success).toBe(true)
    })

    it('rejects an invalid status', () => {
      expect(createProjectSchema.safeParse({ ...validProject(), status: 'tender' }).success).toBe(false)
    })
  })

  describe('client_type enum', () => {
    const types = ['private', 'public'] as const

    test.each(types)('accepts client_type "%s"', (client_type) => {
      expect(createProjectSchema.safeParse({ ...validProject(), client_type }).success).toBe(true)
    })

    it('rejects an invalid client_type', () => {
      expect(createProjectSchema.safeParse({ ...validProject(), client_type: 'ngo' }).success).toBe(false)
    })
  })

  describe('contract_type enum', () => {
    const types = ['fixed_price', 'unit_price', 'cost_plus', 'design_build'] as const

    test.each(types)('accepts contract_type "%s"', (contract_type) => {
      expect(createProjectSchema.safeParse({ ...validProject(), contract_type }).success).toBe(true)
    })

    it('rejects an invalid contract_type', () => {
      expect(createProjectSchema.safeParse({ ...validProject(), contract_type: 'lump_sum' }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// updateProjectSchema
// ---------------------------------------------------------------------------

describe('updateProjectSchema', () => {
  it('accepts an empty object', () => {
    expect(updateProjectSchema.safeParse({}).success).toBe(true)
  })

  it('accepts a status-only update (bidding → awarded)', () => {
    expect(updateProjectSchema.safeParse({ status: 'awarded' }).success).toBe(true)
  })

  it('still rejects invalid project_type in partial update', () => {
    expect(updateProjectSchema.safeParse({ project_type: 'mixed_use' }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// listProjectsSchema — coerce pagination from query strings
// ---------------------------------------------------------------------------

describe('listProjectsSchema', () => {
  it('accepts empty input with defaults', () => {
    const result = listProjectsSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(1)
      expect(result.data.pageSize).toBe(50)
    }
  })

  it('coerces string page and pageSize to numbers', () => {
    const result = listProjectsSchema.safeParse({ page: '2', pageSize: '25' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(2)
      expect(result.data.pageSize).toBe(25)
    }
  })

  it('rejects pageSize above 100', () => {
    expect(listProjectsSchema.safeParse({ pageSize: '101' }).success).toBe(false)
  })

  it('rejects page below 1', () => {
    expect(listProjectsSchema.safeParse({ page: '0' }).success).toBe(false)
  })

  it('accepts optional filter fields', () => {
    const result = listProjectsSchema.safeParse({
      search: 'palmas',
      status: 'in_progress',
      project_type: 'residential',
      client_type: 'public',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.search).toBe('palmas')
      expect(result.data.status).toBe('in_progress')
    }
  })

  it('passes through unknown fields (passthrough schema)', () => {
    const result = listProjectsSchema.safeParse({ extra_filter: 'value' })
    expect(result.success).toBe(true)
  })
})
