import { z } from 'zod'

// ---------------------------------------------------------------------------
// RIF (Registro de Información Fiscal)
// Format: X-XXXXXXXX-X where:
//   - First letter: J (jurídica), V (venezolano), E (extranjero),
//                   G (gobierno), P (pasaporte), C (comunal)
//   - 8 digits
//   - 1 check digit
// Examples: J-12345678-9, V-12345678-0, E-12345678-1
// ---------------------------------------------------------------------------

const RIF_PREFIXES = ['J', 'V', 'E', 'G', 'P', 'C'] as const
export type RifPrefix = (typeof RIF_PREFIXES)[number]

/**
 * Validates a Venezuelan RIF number.
 * Accepts formats: J-12345678-9, J123456789, J-123456789
 */
export const rifSchema = z
  .string()
  .transform((val) => val.toUpperCase().replace(/[\s.-]/g, ''))
  .refine(
    (val) => /^[JVEGPC]\d{9}$/.test(val),
    { message: 'RIF inválido. Formato: J-12345678-9' },
  )
  .transform((val) => {
    // Normalize to X-XXXXXXXX-X format
    const prefix = val[0]
    const digits = val.slice(1, 9)
    const check = val[9]
    return `${prefix}-${digits}-${check}`
  })

/**
 * Validates a Venezuelan Cédula de Identidad.
 * Format: V-12345678 or E-12345678
 * V = venezolano, E = extranjero
 */
export const cedulaSchema = z
  .string()
  .transform((val) => val.toUpperCase().replace(/[\s.-]/g, ''))
  .refine(
    (val) => /^[VE]\d{6,9}$/.test(val),
    { message: 'Cédula inválida. Formato: V-12345678' },
  )
  .transform((val) => {
    const prefix = val[0]
    const number = val.slice(1)
    return `${prefix}-${number}`
  })

/**
 * Accepts either RIF or Cédula
 */
export const fiscalIdSchema = z.union([rifSchema, cedulaSchema])

// ---------------------------------------------------------------------------
// Tax configuration per tenant
// ---------------------------------------------------------------------------

/**
 * IVA (Impuesto al Valor Agregado) rates in Venezuela (2025-2026):
 * - General: 16%
 * - Reduced (electronic payments): 8%
 * - Luxury: 15%
 * - Export: 0%
 * - Exempt: 0% (food, medicine, education, health, transport)
 */
export const IVA_RATES = {
  general: 16,
  reduced: 8,
  luxury: 15,
  export: 0,
  exempt: 0,
} as const

/**
 * IGTF (Impuesto a las Grandes Transacciones Financieras):
 * Applied to payments in foreign currency or crypto.
 * - Regular taxpayer: 3%
 * - Special taxpayer (Contribuyente Especial): 3% (agent of perception)
 *
 * Note: IGTF applies on the total payment amount (including IVA)
 * when paid in USD, EUR, crypto, or any non-VES currency.
 */
export const IGTF_RATES = {
  regular: 3,
  special_taxpayer: 3,
} as const

/**
 * Withholding rates (retenciones):
 * - IVA withholding: 75% of IVA amount (for special taxpayers)
 * - ISLR withholding: varies by activity (1% to 34%)
 */
export const WITHHOLDING_RATES = {
  iva_special_taxpayer: 75, // % of IVA amount retained
  islr_services: 5, // % common for professional services
  islr_purchases: 2, // % common for purchases
} as const

export const fiscalConfigSchema = z.object({
  // Tenant's own fiscal identity
  rif: rifSchema,
  business_name: z.string().min(1).max(255),
  fiscal_address: z.string().min(1).max(500),

  // Tax configuration
  is_special_taxpayer: z.boolean().default(false),
  iva_rate: z.number().min(0).max(100).default(IVA_RATES.general),
  applies_igtf: z.boolean().default(true),
  igtf_rate: z.number().min(0).max(100).default(IGTF_RATES.regular),

  // Withholding agent
  is_iva_withholding_agent: z.boolean().default(false),
  iva_withholding_percentage: z.number().min(0).max(100).default(WITHHOLDING_RATES.iva_special_taxpayer),
  is_islr_withholding_agent: z.boolean().default(false),
})

export const updateFiscalConfigSchema = fiscalConfigSchema.partial()

export type FiscalConfig = z.infer<typeof fiscalConfigSchema>
