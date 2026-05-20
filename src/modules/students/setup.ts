import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'
import type { EntityManager } from '@mikro-orm/postgresql'

type SeedScope = { tenantId: string; organizationId: string }

// =============================================================================
// Education Dictionaries
// =============================================================================

const GRADE_LABELS = [
  { code: 'maternal', label: 'Maternal', order: 1 },
  { code: 'preescolar_1', label: 'Preescolar I', order: 2 },
  { code: 'preescolar_2', label: 'Preescolar II', order: 3 },
  { code: 'preescolar_3', label: 'Preescolar III', order: 4 },
  { code: 'primaria_1', label: '1er Grado', order: 5 },
  { code: 'primaria_2', label: '2do Grado', order: 6 },
  { code: 'primaria_3', label: '3er Grado', order: 7 },
  { code: 'primaria_4', label: '4to Grado', order: 8 },
  { code: 'primaria_5', label: '5to Grado', order: 9 },
  { code: 'primaria_6', label: '6to Grado', order: 10 },
  { code: 'bachillerato_1', label: '1er Año', order: 11 },
  { code: 'bachillerato_2', label: '2do Año', order: 12 },
  { code: 'bachillerato_3', label: '3er Año', order: 13 },
  { code: 'bachillerato_4', label: '4to Año', order: 14 },
  { code: 'bachillerato_5', label: '5to Año', order: 15 },
] as const

const SECTIONS = [
  { code: 'A', label: 'Sección A', order: 1 },
  { code: 'B', label: 'Sección B', order: 2 },
  { code: 'C', label: 'Sección C', order: 3 },
  { code: 'D', label: 'Sección D', order: 4 },
] as const

const RELATIONSHIP_TYPES = [
  { code: 'padre', label: 'Padre', order: 1 },
  { code: 'madre', label: 'Madre', order: 2 },
  { code: 'abuelo', label: 'Abuelo', order: 3 },
  { code: 'abuela', label: 'Abuela', order: 4 },
  { code: 'tio', label: 'Tío', order: 5 },
  { code: 'tia', label: 'Tía', order: 6 },
  { code: 'tutor_legal', label: 'Tutor Legal', order: 7 },
  { code: 'otro', label: 'Otro', order: 8 },
] as const

// =============================================================================
// Seed Functions
// =============================================================================

async function seedEducationDictionaries(em: EntityManager, scope: SeedScope): Promise<void> {
  try {
    const { CustomerDictionaryEntry } = await import(
      '@open-mercato/core/modules/customers/data/entities'
    )

    const existing = await em.find(CustomerDictionaryEntry, {
      tenantId: scope.tenantId,
      organizationId: scope.organizationId,
      kind: { $in: ['grade-levels', 'sections', 'relationship-types'] },
      deletedAt: null,
    } as any)
    const existingKeys = new Set(existing.map((e: any) => `${e.kind}:${e.code}`))

    const now = new Date()
    const entries = [
      ...GRADE_LABELS.map((e) => ({ ...e, kind: 'grade-levels' })),
      ...SECTIONS.map((e) => ({ ...e, kind: 'sections' })),
      ...RELATIONSHIP_TYPES.map((e) => ({ ...e, kind: 'relationship-types' })),
    ]

    let created = 0
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
      created++
    }

    if (created > 0) {
      await em.flush()
      console.log(`[students] Seeded ${created} education dictionary entries`)
    }
  } catch (err: any) {
    console.warn(`[students] Could not seed education dictionaries: ${err.message}`)
  }
}

// =============================================================================
// Module Setup Config
// =============================================================================

export const setup: ModuleSetupConfig = {
  async seedDefaults({ em, tenantId, organizationId }) {
    const scope = { tenantId, organizationId }
    await seedEducationDictionaries(em as EntityManager, scope)
  },

  defaultRoleFeatures: {
    admin: ['students.*'],
    employee: ['students.view', 'students.create', 'students.edit', 'students.manage_representatives'],
  },
}

export default setup
