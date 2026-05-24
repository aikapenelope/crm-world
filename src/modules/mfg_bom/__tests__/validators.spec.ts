/**
 * Unit tests — mfg_bom validators
 *
 * Covers the Zod schemas for BOM headers, BOM lines, alternative materials,
 * and version history records used in the Manufacturing (Phase 24) vertical.
 *
 * Venezuelan manufacturing context:
 *   - BOMs can be of type "process" (recipes with yield) or "discrete" (assembly)
 *   - Alternative materials are critical for managing scarcity (escasez)
 *   - Versions track change history for quality audits (ICONTEC, ISO 9001)
 *
 * Pure tests — no database, no HTTP, no framework dependencies.
 *
 * Reference: https://docs.open-mercato.dev/framework/api/api-development-guide
 * Spec: .ai/specs/ (Phase 24 — Manufactura Industrial)
 */

import {
  bomHeaderCreateSchema,
  bomHeaderUpdateSchema,
  bomLineCreateSchema,
  bomLineUpdateSchema,
  bomAlternativeCreateSchema,
  bomAlternativeUpdateSchema,
  bomVersionCreateSchema,
} from '../data/validators'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const UUID = '11111111-1111-4111-8111-111111111111'
const UUID2 = '22222222-2222-4222-8222-222222222222'

/** Minimal valid BOM header payload. */
const validHeader = () => ({
  product_id: UUID,
  product_code: 'PT-001',
  product_name: 'Galletas de soda 500g',
  base_uom: 'KG',
})

/** Minimal valid BOM line payload. */
const validLine = () => ({
  bom_id: UUID,
  line_number: 1,
  component_id: UUID2,
  component_code: 'MP-HARINA',
  component_name: 'Harina de trigo',
  quantity: '0.5000',
  uom: 'KG',
})

/** Minimal valid BOM alternative payload. */
const validAlternative = () => ({
  bom_line_id: UUID,
  alt_material_id: UUID2,
  alt_material_code: 'MP-HARINA-IMP',
  alt_material_name: 'Harina importada',
})

// ---------------------------------------------------------------------------
// bomHeaderCreateSchema
// ---------------------------------------------------------------------------

describe('bomHeaderCreateSchema', () => {
  describe('required fields', () => {
    it('accepts a minimal valid payload with defaults applied', () => {
      const result = bomHeaderCreateSchema.safeParse(validHeader())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.version).toBe('1.0')
        expect(result.data.status).toBe('draft')
        expect(result.data.bom_type).toBe('discrete')
        expect(result.data.base_quantity).toBe('1.0000')
      }
    })

    it('rejects when product_id is missing', () => {
      const { product_id: _omit, ...rest } = validHeader()
      expect(bomHeaderCreateSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when product_code is missing', () => {
      const { product_code: _omit, ...rest } = validHeader()
      expect(bomHeaderCreateSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when product_name is missing', () => {
      const { product_name: _omit, ...rest } = validHeader()
      expect(bomHeaderCreateSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when base_uom is missing', () => {
      const { base_uom: _omit, ...rest } = validHeader()
      expect(bomHeaderCreateSchema.safeParse(rest).success).toBe(false)
    })
  })

  describe('product_id validation', () => {
    it('rejects a non-UUID product_id', () => {
      expect(bomHeaderCreateSchema.safeParse({ ...validHeader(), product_id: 'not-a-uuid' }).success).toBe(false)
    })
  })

  describe('status enum', () => {
    const validStatuses = ['draft', 'active', 'superseded', 'archived'] as const

    test.each(validStatuses)('accepts status "%s"', (status) => {
      expect(bomHeaderCreateSchema.safeParse({ ...validHeader(), status }).success).toBe(true)
    })

    it('rejects an invalid status', () => {
      expect(bomHeaderCreateSchema.safeParse({ ...validHeader(), status: 'pending' }).success).toBe(false)
    })
  })

  describe('bom_type enum', () => {
    it('accepts type "process" (Venezuelan food/chemical manufacturing)', () => {
      const result = bomHeaderCreateSchema.safeParse({ ...validHeader(), bom_type: 'process' })
      expect(result.success).toBe(true)
    })

    it('accepts type "discrete" (assembly/metalwork)', () => {
      const result = bomHeaderCreateSchema.safeParse({ ...validHeader(), bom_type: 'discrete' })
      expect(result.success).toBe(true)
    })

    it('rejects an invalid bom_type', () => {
      expect(bomHeaderCreateSchema.safeParse({ ...validHeader(), bom_type: 'hybrid' }).success).toBe(false)
    })
  })

  describe('optional fields', () => {
    it('accepts expected_yield_pct as null (discrete BOMs have no yield)', () => {
      const result = bomHeaderCreateSchema.safeParse({ ...validHeader(), expected_yield_pct: null })
      expect(result.success).toBe(true)
    })

    it('accepts expected_yield_pct as a string percentage', () => {
      const result = bomHeaderCreateSchema.safeParse({ ...validHeader(), expected_yield_pct: '92.50' })
      expect(result.success).toBe(true)
    })
  })

  describe('string length limits', () => {
    it('rejects product_code longer than 100 chars', () => {
      expect(bomHeaderCreateSchema.safeParse({ ...validHeader(), product_code: 'X'.repeat(101) }).success).toBe(false)
    })

    it('rejects product_name longer than 255 chars', () => {
      expect(bomHeaderCreateSchema.safeParse({ ...validHeader(), product_name: 'N'.repeat(256) }).success).toBe(false)
    })

    it('rejects version longer than 10 chars', () => {
      expect(bomHeaderCreateSchema.safeParse({ ...validHeader(), version: 'V'.repeat(11) }).success).toBe(false)
    })

    it('rejects base_uom longer than 20 chars', () => {
      expect(bomHeaderCreateSchema.safeParse({ ...validHeader(), base_uom: 'U'.repeat(21) }).success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// bomHeaderUpdateSchema — partial of create
// ---------------------------------------------------------------------------

describe('bomHeaderUpdateSchema', () => {
  it('accepts an empty object (all fields optional in update)', () => {
    expect(bomHeaderUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('accepts a status-only update', () => {
    expect(bomHeaderUpdateSchema.safeParse({ status: 'active' }).success).toBe(true)
  })

  it('still validates enum values on partial update', () => {
    expect(bomHeaderUpdateSchema.safeParse({ status: 'invalid' }).success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// bomLineCreateSchema
// ---------------------------------------------------------------------------

describe('bomLineCreateSchema', () => {
  describe('required fields', () => {
    it('accepts a minimal valid BOM line with defaults applied', () => {
      const result = bomLineCreateSchema.safeParse(validLine())
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.component_type).toBe('raw_material')
        expect(result.data.scrap_pct).toBe('0.00')
        expect(result.data.is_critical).toBe(true)
        expect(result.data.is_phantom).toBe(false)
        expect(result.data.lead_offset_days).toBe(0)
      }
    })

    it('rejects when bom_id is missing', () => {
      const { bom_id: _omit, ...rest } = validLine()
      expect(bomLineCreateSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects when component_id is not a UUID', () => {
      expect(bomLineCreateSchema.safeParse({ ...validLine(), component_id: 'bad' }).success).toBe(false)
    })

    it('rejects line_number = 0 (must be at least 1)', () => {
      expect(bomLineCreateSchema.safeParse({ ...validLine(), line_number: 0 }).success).toBe(false)
    })

    it('rejects negative lead_offset_days', () => {
      expect(bomLineCreateSchema.safeParse({ ...validLine(), lead_offset_days: -1 }).success).toBe(false)
    })
  })

  describe('component_type enum', () => {
    const types = ['raw_material', 'packaging', 'subassembly', 'consumable'] as const

    test.each(types)('accepts component_type "%s"', (component_type) => {
      expect(bomLineCreateSchema.safeParse({ ...validLine(), component_type }).success).toBe(true)
    })

    it('rejects an invalid component_type', () => {
      expect(bomLineCreateSchema.safeParse({ ...validLine(), component_type: 'labor' }).success).toBe(false)
    })
  })

  describe('phantom/critical flags', () => {
    it('accepts is_phantom=true for phantom sub-assemblies', () => {
      const result = bomLineCreateSchema.safeParse({ ...validLine(), is_phantom: true, component_type: 'subassembly' })
      expect(result.success).toBe(true)
    })

    it('accepts is_critical=false for non-critical components', () => {
      const result = bomLineCreateSchema.safeParse({ ...validLine(), is_critical: false })
      expect(result.success).toBe(true)
    })
  })
})

// ---------------------------------------------------------------------------
// bomAlternativeCreateSchema — Venezuelan scarcity management
// ---------------------------------------------------------------------------

describe('bomAlternativeCreateSchema', () => {
  it('accepts a minimal valid alternative with defaults', () => {
    const result = bomAlternativeCreateSchema.safeParse(validAlternative())
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.usage_condition).toBe('shortage_only')
      expect(result.data.conversion_factor).toBe('1.0000')
      expect(result.data.is_active).toBe(true)
    }
  })

  it('rejects when bom_line_id is missing', () => {
    const { bom_line_id: _omit, ...rest } = validAlternative()
    expect(bomAlternativeCreateSchema.safeParse(rest).success).toBe(false)
  })

  it('rejects when alt_material_id is not a UUID', () => {
    expect(bomAlternativeCreateSchema.safeParse({ ...validAlternative(), alt_material_id: 'not-uuid' }).success).toBe(false)
  })

  describe('usage_condition enum', () => {
    const conditions = ['shortage_only', 'approved_equivalent', 'cost_reduction'] as const

    test.each(conditions)('accepts usage_condition "%s"', (usage_condition) => {
      expect(bomAlternativeCreateSchema.safeParse({ ...validAlternative(), usage_condition }).success).toBe(true)
    })

    it('rejects an invalid usage_condition', () => {
      expect(bomAlternativeCreateSchema.safeParse({ ...validAlternative(), usage_condition: 'preferred' }).success).toBe(false)
    })
  })

  it('accepts null quality_impact_notes', () => {
    expect(bomAlternativeCreateSchema.safeParse({ ...validAlternative(), quality_impact_notes: null }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// bomVersionCreateSchema — change history / audit trail
// ---------------------------------------------------------------------------

describe('bomVersionCreateSchema', () => {
  const validVersion = () => ({
    product_id: UUID,
    product_code: 'PT-001',
    from_version: '1.0',
    to_version: '2.0',
    change_type: 'component_change' as const,
    change_summary: 'Sustitución MP-HARINA por MP-HARINA-IMP por escasez',
  })

  it('accepts a valid version record', () => {
    expect(bomVersionCreateSchema.safeParse(validVersion()).success).toBe(true)
  })

  it('rejects when change_summary is empty', () => {
    expect(bomVersionCreateSchema.safeParse({ ...validVersion(), change_summary: '' }).success).toBe(false)
  })

  it('rejects when product_id is not a UUID', () => {
    expect(bomVersionCreateSchema.safeParse({ ...validVersion(), product_id: 'bad' }).success).toBe(false)
  })

  describe('change_type enum', () => {
    const types = ['component_change', 'quantity_change', 'yield_change', 'new_alternative', 'process_change'] as const

    test.each(types)('accepts change_type "%s"', (change_type) => {
      expect(bomVersionCreateSchema.safeParse({ ...validVersion(), change_type }).success).toBe(true)
    })

    it('rejects an invalid change_type', () => {
      expect(bomVersionCreateSchema.safeParse({ ...validVersion(), change_type: 'other' }).success).toBe(false)
    })
  })

  it('accepts optional changed_by and approved_by as UUID or null', () => {
    const result = bomVersionCreateSchema.safeParse({
      ...validVersion(),
      changed_by: UUID,
      approved_by: null,
      approved_at: new Date(),
    })
    expect(result.success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// bomLineUpdateSchema — partial of create
// ---------------------------------------------------------------------------

describe('bomLineUpdateSchema', () => {
  it('accepts an empty object', () => {
    expect(bomLineUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('accepts a quantity-only update', () => {
    expect(bomLineUpdateSchema.safeParse({ quantity: '1.5000' }).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// bomAlternativeUpdateSchema — partial of create
// ---------------------------------------------------------------------------

describe('bomAlternativeUpdateSchema', () => {
  it('accepts an empty object', () => {
    expect(bomAlternativeUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('still validates usage_condition enum on partial update', () => {
    expect(bomAlternativeUpdateSchema.safeParse({ usage_condition: 'invalid' }).success).toBe(false)
  })
})
