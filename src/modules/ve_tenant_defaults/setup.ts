import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'
import type { EntityManager } from '@mikro-orm/postgresql'

type SeedScope = { tenantId: string; organizationId: string }

// ---------------------------------------------------------------------------
// Venezuelan Tax Rates
// Replaces the default Polish VAT rates with Venezuelan IVA/IGTF
// ---------------------------------------------------------------------------
const VE_TAX_RATES = [
  { code: 'iva-16', name: 'IVA General (16%)', rate: '16', isDefault: true },
  { code: 'iva-8', name: 'IVA Reducido (8%)', rate: '8', isDefault: false },
  { code: 'iva-15', name: 'IVA Lujo (15%)', rate: '15', isDefault: false },
  { code: 'iva-0', name: 'Exento de IVA', rate: '0', isDefault: false },
  { code: 'igtf-3', name: 'IGTF (3%)', rate: '3', isDefault: false },
] as const

async function seedVenezuelaTaxRates(em: EntityManager, scope: SeedScope): Promise<void> {
  const { SalesTaxRate } = await import('@open-mercato/core/modules/sales/data/entities')

  // Remove default Polish rates if they exist
  const polishRates = await em.find(SalesTaxRate, {
    tenantId: scope.tenantId,
    organizationId: scope.organizationId,
    code: { $in: ['vat-23', 'vat-0'] },
    deletedAt: null,
  } as any)

  for (const rate of polishRates) {
    rate.deletedAt = new Date()
  }

  // Seed Venezuelan rates
  const existing = await em.find(SalesTaxRate, {
    tenantId: scope.tenantId,
    organizationId: scope.organizationId,
    deletedAt: null,
  } as any)
  const existingCodes = new Set(existing.map((r: any) => r.code))

  const now = new Date()
  for (const seed of VE_TAX_RATES) {
    if (existingCodes.has(seed.code)) continue
    em.persist(
      em.create(SalesTaxRate, {
        tenantId: scope.tenantId,
        organizationId: scope.organizationId,
        code: seed.code,
        name: seed.name,
        rate: seed.rate,
        priority: 0,
        isCompound: false,
        isDefault: seed.isDefault,
        createdAt: now,
        updatedAt: now,
      } as any),
    )
  }

  await em.flush()
  console.log(`[ve_tenant_defaults] Seeded ${VE_TAX_RATES.length} Venezuelan tax rates`)
}

// ---------------------------------------------------------------------------
// Venezuelan Dictionaries (CRM)
// ---------------------------------------------------------------------------
const VE_ADDRESS_TYPES = [
  { label: 'Casa', code: 'casa', order: 1 },
  { label: 'Apartamento', code: 'apartamento', order: 2 },
  { label: 'Oficina', code: 'oficina', order: 3 },
  { label: 'Local Comercial', code: 'local_comercial', order: 4 },
  { label: 'Galpón', code: 'galpon', order: 5 },
  { label: 'Terreno', code: 'terreno', order: 6 },
]

const VE_SOURCES = [
  { label: 'Referido', code: 'referido', order: 1 },
  { label: 'Instagram', code: 'instagram', order: 2 },
  { label: 'WhatsApp', code: 'whatsapp', order: 3 },
  { label: 'Sitio Web', code: 'sitio_web', order: 4 },
  { label: 'Facebook', code: 'facebook', order: 5 },
  { label: 'TikTok', code: 'tiktok', order: 6 },
  { label: 'Otro', code: 'otro', order: 7 },
]

const VE_INDUSTRIES = [
  { label: 'Comercio', code: 'comercio', order: 1 },
  { label: 'Servicios', code: 'servicios', order: 2 },
  { label: 'Construcción', code: 'construccion', order: 3 },
  { label: 'Alimentos', code: 'alimentos', order: 4 },
  { label: 'Tecnología', code: 'tecnologia', order: 5 },
  { label: 'Salud', code: 'salud', order: 6 },
  { label: 'Educación', code: 'educacion', order: 7 },
  { label: 'Inmobiliaria', code: 'inmobiliaria', order: 8 },
  { label: 'Transporte', code: 'transporte', order: 9 },
  { label: 'Manufactura', code: 'manufactura', order: 10 },
]

const VE_DOCUMENT_TYPES = [
  { label: 'Contrato', code: 'contrato', order: 1 },
  { label: 'Escritura', code: 'escritura', order: 2 },
  { label: 'Avalúo', code: 'avaluo', order: 3 },
  { label: 'Plano', code: 'plano', order: 4 },
  { label: 'Factura', code: 'factura', order: 5 },
  { label: 'Acta', code: 'acta', order: 6 },
  { label: 'Poder notariado', code: 'poder', order: 7 },
  { label: 'Cédula de identidad', code: 'cedula', order: 8 },
  { label: 'RIF', code: 'rif', order: 9 },
  { label: 'Solvencia municipal', code: 'solvencia_municipal', order: 10 },
  { label: 'Certificación de gravamen', code: 'certificacion_gravamen', order: 11 },
  { label: 'Otro', code: 'otro', order: 12 },
]

async function seedVenezuelaDictionaries(em: EntityManager, scope: SeedScope): Promise<void> {
  // Dictionaries are seeded via the customers module's dictionary system
  // We use the same entity pattern as the core
  try {
    const { CustomerDictionaryEntry } = await import(
      '@open-mercato/core/modules/customers/data/entities'
    )

    const existing = await em.find(CustomerDictionaryEntry, {
      tenantId: scope.tenantId,
      organizationId: scope.organizationId,
      deletedAt: null,
    } as any)
    const existingKeys = new Set(existing.map((e: any) => `${e.kind}:${e.code}`))

    const now = new Date()
    const entries = [
      ...VE_ADDRESS_TYPES.map((e) => ({ ...e, kind: 'address-types' })),
      ...VE_SOURCES.map((e) => ({ ...e, kind: 'sources' })),
      ...VE_INDUSTRIES.map((e) => ({ ...e, kind: 'industries' })),
      ...VE_DOCUMENT_TYPES.map((e) => ({ ...e, kind: 'document-types' })),
    ]

    for (const entry of entries) {
      const key = `${entry.kind}:${entry.code}`
      if (existingKeys.has(key)) continue
      em.persist(
        em.create(CustomerDictionaryEntry, {
          tenantId: scope.tenantId,
          organizationId: scope.organizationId,
          kind: entry.kind,
          code: entry.code,
          label: entry.label,
          sortOrder: entry.order,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        } as any),
      )
    }

    await em.flush()
    console.log(`[ve_tenant_defaults] Seeded ${entries.length} dictionary entries`)
  } catch (err: any) {
    // Dictionary entity might not be available in all setups
    console.warn(`[ve_tenant_defaults] Could not seed dictionaries: ${err.message}`)
  }
}

// ---------------------------------------------------------------------------
// Sales Document Number Format (Venezuelan style)
// ---------------------------------------------------------------------------
async function configureDocumentNumbers(em: EntityManager, scope: SeedScope): Promise<void> {
  try {
    const { SalesSettings } = await import('@open-mercato/core/modules/sales/data/entities')

    const settings = await em.findOne(SalesSettings, {
      tenantId: scope.tenantId,
      organizationId: scope.organizationId,
    } as any)

    if (settings) {
      // Venezuelan document number format
      ;(settings as any).orderNumberFormat = 'ORD-{yyyy}{mm}-{seq:5}'
      ;(settings as any).quoteNumberFormat = 'COT-{yyyy}{mm}-{seq:5}'
      settings.updatedAt = new Date()
      await em.flush()
      console.log(`[ve_tenant_defaults] Configured Venezuelan document number format`)
    }
  } catch (err: any) {
    console.warn(`[ve_tenant_defaults] Could not configure document numbers: ${err.message}`)
  }
}

// ---------------------------------------------------------------------------
// Address Format (street_first for Venezuela)
// ---------------------------------------------------------------------------
async function configureAddressFormat(em: EntityManager, scope: SeedScope): Promise<void> {
  try {
    const { CustomerSettings } = await import('@open-mercato/core/modules/customers/data/entities')

    let settings = await em.findOne(CustomerSettings, {
      tenantId: scope.tenantId,
      organizationId: scope.organizationId,
    } as any)

    if (settings) {
      ;(settings as any).addressFormat = 'street_first'
      settings.updatedAt = new Date()
    } else {
      settings = em.create(CustomerSettings, {
        tenantId: scope.tenantId,
        organizationId: scope.organizationId,
        addressFormat: 'street_first',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)
      em.persist(settings)
    }

    await em.flush()
    console.log(`[ve_tenant_defaults] Set address format to street_first`)
  } catch (err: any) {
    console.warn(`[ve_tenant_defaults] Could not configure address format: ${err.message}`)
  }
}

// ---------------------------------------------------------------------------
// Strip non-RE features from tenant roles (Real Estate CRM only)
// ---------------------------------------------------------------------------
const ALLOWED_FEATURE_PREFIXES = [
  'dashboards',
  'analytics',
  'auth',
  'directory',
  'customers',
  'perspectives',
  'entities',
  'configs',
  'query_index',
  'audit_logs',
  'attachments',
  'dictionaries',
  'planner',
  'notifications',
  'progress',
  'search',
  'vector',
  'currencies',
  'messages',
  'ai_assistant',
  'translations',
  'scheduler',
  'workflows',
  // Venezuela regional
  'payment_methods',
  've_fiscal',
  // Real Estate vertical
  'properties',
  'transactions',
  'matching',
  'market_intelligence',
  'mercadolibre_sync',
]

function isAllowedFeature(feature: string): boolean {
  return ALLOWED_FEATURE_PREFIXES.some((prefix) =>
    feature === prefix || feature.startsWith(`${prefix}.`),
  )
}

async function stripNonRealEstateFeatures(em: EntityManager, tenantId: string): Promise<void> {
  try {
    const kysely = (em as any).getKysely()

    // Get all role_acls for this tenant (non-superadmin)
    const acls = await kysely
      .selectFrom('role_acls')
      .select(['id', 'features_json'])
      .where('tenant_id', '=', tenantId)
      .where('is_super_admin', '=', false)
      .execute()

    for (const acl of acls) {
      const features = acl.features_json as string[]
      const filtered = features.filter(isAllowedFeature)

      if (filtered.length !== features.length) {
        await kysely
          .updateTable('role_acls')
          .set({ features_json: JSON.stringify(filtered), updated_at: new Date() })
          .where('id', '=', acl.id)
          .execute()
      }
    }

    const removed = acls.reduce((sum: number, acl: any) => {
      const original = (acl.features_json as string[]).length
      const kept = (acl.features_json as string[]).filter(isAllowedFeature).length
      return sum + (original - kept)
    }, 0)

    console.log(`[ve_tenant_defaults] Stripped ${removed} non-RE features from tenant roles`)
  } catch (err: any) {
    console.warn(`[ve_tenant_defaults] Could not strip features: ${err.message}`)
  }
}

// ---------------------------------------------------------------------------
// Module Setup
// ---------------------------------------------------------------------------
export const setup: ModuleSetupConfig = {
  async onTenantCreated({ em, tenantId, organizationId }) {
    const scope = { tenantId, organizationId }
    await configureDocumentNumbers(em as EntityManager, scope)
    await configureAddressFormat(em as EntityManager, scope)
  },

  async seedDefaults({ em, tenantId, organizationId }) {
    const scope = { tenantId, organizationId }
    await seedVenezuelaTaxRates(em as EntityManager, scope)
    await seedVenezuelaDictionaries(em as EntityManager, scope)
    // After all modules seed their default features, strip the ones
    // that don't belong to the Real Estate CRM vertical
    await stripNonRealEstateFeatures(em as EntityManager, tenantId)
  },
}

export default setup
