/**
 * Unit tests — ve_fiscal validators
 *
 * Covers Venezuelan fiscal document validation (RIF, Cédula) and the tax
 * constants (IVA, IGTF, retenciones) used across all tenants in the Aika platform.
 *
 * All tests are pure: no database, no HTTP, no framework dependencies.
 *
 * Reference: https://docs.open-mercato.dev/framework/modules/overview
 * Open Mercato testing conventions: AGENTS.md §"Key Commands" → `yarn test`
 */

import {
  rifSchema,
  cedulaSchema,
  fiscalIdSchema,
  fiscalConfigSchema,
  updateFiscalConfigSchema,
  IVA_RATES,
  IGTF_RATES,
  WITHHOLDING_RATES,
} from '../data/validators'

// ---------------------------------------------------------------------------
// RIF Schema
// ---------------------------------------------------------------------------

describe('rifSchema', () => {
  describe('valid RIF inputs', () => {
    // Each Venezuelan legal entity type must be accepted.
    const validCases: Array<[string, string, string]> = [
      ['J-12345678-9', 'J-12345678-9', 'jurídica (formatted)'],
      ['J123456789',   'J-12345678-9', 'jurídica (no dashes)'],
      ['V-12345678-9', 'V-12345678-9', 'venezolano natural'],
      ['E-12345678-9', 'E-12345678-9', 'extranjero'],
      ['G-12345678-9', 'G-12345678-9', 'gobierno'],
      ['P-12345678-9', 'P-12345678-9', 'pasaporte'],
      ['C-12345678-9', 'C-12345678-9', 'comunal'],
      ['j-12345678-9', 'J-12345678-9', 'lowercase prefix is normalised'],
      ['J 12345678 9', 'J-12345678-9', 'spaces are stripped'],
      ['J.12345678.9', 'J-12345678-9', 'dots are stripped'],
    ]

    test.each(validCases)('parses "%s" → "%s" (%s)', (input, expected) => {
      const result = rifSchema.safeParse(input)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe(expected)
      }
    })
  })

  describe('invalid RIF inputs', () => {
    const invalidCases: Array<[string, string]> = [
      ['12345678-9',    'missing prefix letter'],
      ['X-12345678-9',  'invalid prefix X'],
      ['J-1234567-9',   'only 7 digits (need 8)'],
      ['J-123456789-0', '9 digits (too many)'],
      ['',              'empty string'],
      ['J-ABCDEFGH-9',  'letters in numeric section'],
      ['V12345',        'too short'],
    ]

    test.each(invalidCases)('rejects "%s" (%s)', (input) => {
      const result = rifSchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('returns the correct error message in Spanish', () => {
      const result = rifSchema.safeParse('INVALID')
      expect(result.success).toBe(false)
      if (!result.success) {
        const messages = result.error.errors.map((e) => e.message)
        expect(messages).toContain('RIF inválido. Formato: J-12345678-9')
      }
    })
  })

  describe('output normalisation', () => {
    it('always outputs the canonical X-XXXXXXXX-X format', () => {
      const formats = ['J123456789', 'J-12345678-9', 'j.12345678.9', 'J 12345678 9']
      for (const fmt of formats) {
        const result = rifSchema.safeParse(fmt)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toMatch(/^[JVEGPC]-\d{8}-\d$/)
        }
      }
    })
  })
})

// ---------------------------------------------------------------------------
// Cédula Schema
// ---------------------------------------------------------------------------

describe('cedulaSchema', () => {
  describe('valid Cédula inputs', () => {
    const validCases: Array<[string, string, string]> = [
      ['V-12345678',  'V-12345678',  'venezolano (formatted)'],
      ['V12345678',   'V-12345678',  'venezolano (no dash)'],
      ['E-12345678',  'E-12345678',  'extranjero'],
      ['v-12345678',  'V-12345678',  'lowercase normalised'],
      ['V-123456',    'V-123456',    'minimum 6 digits'],
      ['V-123456789', 'V-123456789', 'maximum 9 digits'],
    ]

    test.each(validCases)('parses "%s" → "%s" (%s)', (input, expected) => {
      const result = cedulaSchema.safeParse(input)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe(expected)
      }
    })
  })

  describe('invalid Cédula inputs', () => {
    const invalidCases: Array<[string, string]> = [
      ['J-12345678',   'J prefix not valid for cédula'],
      ['12345678',     'missing prefix'],
      ['V-12345',      'only 5 digits (min is 6)'],
      ['V-1234567890', '10 digits (max is 9)'],
      ['V-ABCDEFGH',   'letters in number'],
      ['',             'empty string'],
    ]

    test.each(invalidCases)('rejects "%s" (%s)', (input) => {
      const result = cedulaSchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('returns the correct Spanish error message', () => {
      const result = cedulaSchema.safeParse('99999999')
      expect(result.success).toBe(false)
      if (!result.success) {
        const messages = result.error.errors.map((e) => e.message)
        expect(messages).toContain('Cédula inválida. Formato: V-12345678')
      }
    })
  })
})

// ---------------------------------------------------------------------------
// fiscalIdSchema — union type (RIF or Cédula)
// ---------------------------------------------------------------------------

describe('fiscalIdSchema', () => {
  it('accepts a valid RIF', () => {
    const result = fiscalIdSchema.safeParse('J-12345678-9')
    expect(result.success).toBe(true)
  })

  it('accepts a valid Cédula', () => {
    const result = fiscalIdSchema.safeParse('V-12345678')
    expect(result.success).toBe(true)
  })

  it('rejects a value that is neither RIF nor Cédula', () => {
    const result = fiscalIdSchema.safeParse('X-99999999')
    expect(result.success).toBe(false)
  })

  it('normalises RIF to canonical format', () => {
    const result = fiscalIdSchema.safeParse('j123456789')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('J-12345678-9')
    }
  })
})

// ---------------------------------------------------------------------------
// Tax rate constants — the fiscal reality of Venezuela
// ---------------------------------------------------------------------------

describe('IVA_RATES', () => {
  it('general rate is 16 %', () => {
    expect(IVA_RATES.general).toBe(16)
  })

  it('reduced rate (electronic payments) is 8 %', () => {
    expect(IVA_RATES.reduced).toBe(8)
  })

  it('luxury rate is 15 %', () => {
    expect(IVA_RATES.luxury).toBe(15)
  })

  it('export rate is 0 %', () => {
    expect(IVA_RATES.export).toBe(0)
  })

  it('exempt rate (food, medicine, education, health) is 0 %', () => {
    expect(IVA_RATES.exempt).toBe(0)
  })
})

describe('IGTF_RATES', () => {
  // IGTF (Impuesto a las Grandes Transacciones Financieras)
  // applies to payments in foreign currency or crypto.
  it('regular taxpayer rate is 3 %', () => {
    expect(IGTF_RATES.regular).toBe(3)
  })

  it('special taxpayer rate is 3 % (same — agent of perception)', () => {
    expect(IGTF_RATES.special_taxpayer).toBe(3)
  })
})

describe('WITHHOLDING_RATES', () => {
  it('IVA withholding for special taxpayers is 75 % of the IVA amount', () => {
    expect(WITHHOLDING_RATES.iva_special_taxpayer).toBe(75)
  })

  it('ISLR withholding for professional services is 5 %', () => {
    expect(WITHHOLDING_RATES.islr_services).toBe(5)
  })

  it('ISLR withholding for purchases is 2 %', () => {
    expect(WITHHOLDING_RATES.islr_purchases).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// fiscalConfigSchema — full tenant fiscal configuration
// ---------------------------------------------------------------------------

describe('fiscalConfigSchema', () => {
  const validBase = {
    rif: 'J-12345678-9',
    business_name: 'ACME Constructora C.A.',
    fiscal_address: 'Av. Libertador, Caracas, Venezuela',
  }

  it('accepts a minimal valid fiscal config with defaults', () => {
    const result = fiscalConfigSchema.safeParse(validBase)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.iva_rate).toBe(IVA_RATES.general)
      expect(result.data.applies_igtf).toBe(true)
      expect(result.data.igtf_rate).toBe(IGTF_RATES.regular)
      expect(result.data.is_special_taxpayer).toBe(false)
      expect(result.data.is_iva_withholding_agent).toBe(false)
      expect(result.data.is_islr_withholding_agent).toBe(false)
      expect(result.data.iva_withholding_percentage).toBe(WITHHOLDING_RATES.iva_special_taxpayer)
    }
  })

  it('accepts a special-taxpayer config with custom rates', () => {
    const result = fiscalConfigSchema.safeParse({
      ...validBase,
      is_special_taxpayer: true,
      is_iva_withholding_agent: true,
      iva_withholding_percentage: 100,
      applies_igtf: false,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.is_special_taxpayer).toBe(true)
      expect(result.data.is_iva_withholding_agent).toBe(true)
      expect(result.data.iva_withholding_percentage).toBe(100)
      expect(result.data.applies_igtf).toBe(false)
    }
  })

  it('rejects a config with an invalid RIF', () => {
    const result = fiscalConfigSchema.safeParse({
      ...validBase,
      rif: 'INVALID',
    })
    expect(result.success).toBe(false)
  })

  it('rejects a config with an empty business_name', () => {
    const result = fiscalConfigSchema.safeParse({
      ...validBase,
      business_name: '',
    })
    expect(result.success).toBe(false)
  })

  it('rejects an IVA rate above 100 %', () => {
    const result = fiscalConfigSchema.safeParse({
      ...validBase,
      iva_rate: 101,
    })
    expect(result.success).toBe(false)
  })

  it('rejects a negative IGTF rate', () => {
    const result = fiscalConfigSchema.safeParse({
      ...validBase,
      igtf_rate: -1,
    })
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// updateFiscalConfigSchema — partial patch version
// ---------------------------------------------------------------------------

describe('updateFiscalConfigSchema', () => {
  it('accepts an empty object (all fields optional)', () => {
    const result = updateFiscalConfigSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('accepts a partial update with only iva_rate', () => {
    const result = updateFiscalConfigSchema.safeParse({ iva_rate: 8 })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.iva_rate).toBe(8)
    }
  })

  it('still validates field correctness on provided fields', () => {
    const result = updateFiscalConfigSchema.safeParse({ rif: 'INVALID_RIF' })
    expect(result.success).toBe(false)
  })
})
