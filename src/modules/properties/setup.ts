import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'
import type { EntityManager } from '@mikro-orm/postgresql'

type SeedScope = { tenantId: string; organizationId: string }

// =============================================================================
// Real Estate Pipeline Stages
// =============================================================================

const RE_PIPELINE_STAGES = [
  { label: 'Contacto Inicial', value: 'contacto_inicial', color: '#38bdf8', icon: 'lucide:phone' },
  { label: 'Calificación', value: 'calificacion', color: '#a855f7', icon: 'lucide:filter' },
  { label: 'Visita Programada', value: 'visita_programada', color: '#f97316', icon: 'lucide:calendar' },
  { label: 'Negociación', value: 'negociacion', color: '#facc15', icon: 'lucide:handshake' },
  { label: 'Documentación', value: 'documentacion', color: '#22c55e', icon: 'lucide:file-text' },
  { label: 'Cierre', value: 'cierre', color: '#16a34a', icon: 'lucide:check-circle' },
  { label: 'Perdido', value: 'perdido', color: '#ef4444', icon: 'lucide:x-circle' },
] as const

// =============================================================================
// Real Estate Tags (seeded as dictionary entries)
// =============================================================================

const RE_TAGS = [
  { label: 'Comprador', code: 'comprador', color: '#3b82f6' },
  { label: 'Vendedor', code: 'vendedor', color: '#10b981' },
  { label: 'Inversor', code: 'inversor', color: '#8b5cf6' },
  { label: 'Inquilino', code: 'inquilino', color: '#f59e0b' },
  { label: 'Propietario', code: 'propietario', color: '#06b6d4' },
  { label: 'Referido', code: 'referido', color: '#ec4899' },
  { label: 'Caliente', code: 'caliente', color: '#ef4444' },
  { label: 'Tibio', code: 'tibio', color: '#f97316' },
  { label: 'Frío', code: 'frio', color: '#6b7280' },
] as const

// =============================================================================
// Real Estate Feature Toggles
// =============================================================================

const RE_FEATURE_TOGGLES = [
  {
    identifier: 'properties.enabled',
    name: 'Módulo de Propiedades',
    description: 'Habilita la gestión de propiedades inmobiliarias.',
    category: 'real_estate',
    type: 'boolean' as const,
    defaultValue: true,
  },
  {
    identifier: 'transactions.enabled',
    name: 'Módulo de Transacciones',
    description: 'Habilita el registro de cierres y comisiones.',
    category: 'real_estate',
    type: 'boolean' as const,
    defaultValue: true,
  },
  {
    identifier: 'matching.enabled',
    name: 'Motor de Matching',
    description: 'Habilita el cruce automático contacto-propiedad.',
    category: 'real_estate',
    type: 'boolean' as const,
    defaultValue: true,
  },
  {
    identifier: 'market_intelligence.enabled',
    name: 'Inteligencia de Mercado',
    description: 'Habilita tasación y comparables desde MercadoLibre.',
    category: 'real_estate',
    type: 'boolean' as const,
    defaultValue: true,
  },
  {
    identifier: 'property_portal.enabled',
    name: 'Portal Público de Propiedades',
    description: 'Habilita las páginas públicas /p/[id] para compartir propiedades.',
    category: 'real_estate',
    type: 'boolean' as const,
    defaultValue: true,
  },
] as const

// =============================================================================
// Seed Functions
// =============================================================================

/**
 * Seed a Real Estate-specific pipeline.
 * Creates a pipeline named "Inmobiliaria" with RE-specific stages.
 * Does NOT replace the default pipeline — adds a second one for RE workflows.
 */
async function seedRealEstatePipeline(em: EntityManager, scope: SeedScope): Promise<void> {
  try {
    const { CustomerPipeline, CustomerPipelineStage } = await import(
      '@open-mercato/core/modules/customers/data/entities'
    )

    // Check if RE pipeline already exists
    const existing = await em.findOne(CustomerPipeline, {
      tenantId: scope.tenantId,
      organizationId: scope.organizationId,
      name: 'Inmobiliaria',
    } as any)
    if (existing) return

    const pipeline = em.create(CustomerPipeline, {
      tenantId: scope.tenantId,
      organizationId: scope.organizationId,
      name: 'Inmobiliaria',
      isDefault: true,
    } as any)
    em.persist(pipeline)
    await em.flush()

    for (let i = 0; i < RE_PIPELINE_STAGES.length; i++) {
      const stage = RE_PIPELINE_STAGES[i]
      em.persist(
        em.create(CustomerPipelineStage, {
          tenantId: scope.tenantId,
          organizationId: scope.organizationId,
          pipelineId: (pipeline as any).id,
          label: stage.label,
          order: i,
        } as any),
      )
    }
    await em.flush()
    console.log(`[properties] Seeded Real Estate pipeline with ${RE_PIPELINE_STAGES.length} stages`)
  } catch (err: any) {
    console.warn(`[properties] Could not seed RE pipeline: ${err.message}`)
  }
}

/**
 * Seed Real Estate tags as customer dictionary entries.
 * These appear in the tag selector when managing contacts.
 */
async function seedRealEstateTags(em: EntityManager, scope: SeedScope): Promise<void> {
  try {
    const { CustomerDictionaryEntry } = await import(
      '@open-mercato/core/modules/customers/data/entities'
    )

    const existing = await em.find(CustomerDictionaryEntry, {
      tenantId: scope.tenantId,
      organizationId: scope.organizationId,
      kind: 'tags',
      deletedAt: null,
    } as any)
    const existingCodes = new Set(existing.map((e: any) => e.code))

    const now = new Date()
    let created = 0
    for (const tag of RE_TAGS) {
      if (existingCodes.has(tag.code)) continue
      em.persist(
        em.create(CustomerDictionaryEntry, {
          tenantId: scope.tenantId,
          organizationId: scope.organizationId,
          kind: 'tags',
          code: tag.code,
          label: tag.label,
          color: tag.color,
          sortOrder: RE_TAGS.indexOf(tag),
          isActive: true,
          createdAt: now,
          updatedAt: now,
        } as any),
      )
      created++
    }

    if (created > 0) {
      await em.flush()
      console.log(`[properties] Seeded ${created} Real Estate tags`)
    }
  } catch (err: any) {
    console.warn(`[properties] Could not seed RE tags: ${err.message}`)
  }
}

/**
 * Seed Real Estate feature toggles.
 * These control which RE modules are visible per tenant.
 */
async function seedRealEstateFeatureToggles(em: EntityManager): Promise<void> {
  try {
    const { FeatureToggle } = await import(
      '@open-mercato/core/modules/feature_toggles/data/entities'
    )

    let created = 0
    for (const toggle of RE_FEATURE_TOGGLES) {
      const existing = await em.findOne(FeatureToggle, {
        identifier: toggle.identifier,
        deletedAt: null,
      } as any)
      if (existing) continue

      em.persist(
        em.create(FeatureToggle, {
          identifier: toggle.identifier,
          name: toggle.name,
          description: toggle.description,
          category: toggle.category,
          type: toggle.type,
          defaultValue: toggle.defaultValue,
        } as any),
      )
      created++
    }

    if (created > 0) {
      await em.flush()
      console.log(`[properties] Seeded ${created} Real Estate feature toggles`)
    }
  } catch (err: any) {
    console.warn(`[properties] Could not seed RE feature toggles: ${err.message}`)
  }
}

// =============================================================================
// Module Setup Config
// =============================================================================

export const setup: ModuleSetupConfig = {
  /**
   * Called when a new tenant is created.
   * Sets up the RE pipeline as the default pipeline for this tenant.
   */
  async onTenantCreated({ em, tenantId, organizationId }) {
    const scope = { tenantId, organizationId }
    await seedRealEstatePipeline(em as EntityManager, scope)
  },

  /**
   * Called during `mercato init` or `mercato auth setup`.
   * Seeds all Real Estate defaults: tags, feature toggles.
   * Pipeline is seeded in onTenantCreated (runs first).
   */
  async seedDefaults({ em, tenantId, organizationId }) {
    const scope = { tenantId, organizationId }
    await seedRealEstateTags(em as EntityManager, scope)
    await seedRealEstateFeatureToggles(em as EntityManager)
  },

  defaultRoleFeatures: {
    admin: ['properties.*'],
    employee: ['properties.view', 'properties.create', 'properties.edit'],
  },
}

export default setup
