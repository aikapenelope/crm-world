import type {
  SearchModuleConfig,
  SearchBuildContext,
  SearchIndexSource,
  SearchResultPresenter,
} from '@open-mercato/shared/modules/search'

function norm(v: unknown): string | null {
  if (v == null) return null
  const s = String(v).trim()
  return s.length > 0 ? s : null
}

const UNIT_TYPE_LABELS: Record<string, string> = {
  poultry:      'Avícola',
  swine:        'Porcícola',
  bovine:       'Bovino',
  agricultural: 'Agrícola',
  mixed:        'Mixto',
}

const SPECIES_LABELS: Record<string, string> = {
  broiler: 'Pollo engorde',
  layer:   'Gallina ponedora',
  turkey:  'Pavo',
  swine:   'Cerdo',
  bovine:  'Bovino',
}

const FLOCK_STATUS_LABELS: Record<string, string> = {
  active:           'Activo',
  completed:        'Completado',
  terminated_early: 'Terminado anticipado',
}

export const searchConfig: SearchModuleConfig = {
  entities: [
    // =========================================================================
    // agri_units.farm_unit — Granjas y galpones
    // =========================================================================
    {
      entityId: 'agri_units.farm_unit',
      enabled: true,
      priority: 40,

      fieldPolicy: {
        searchable: ['name', 'unit_type', 'status', 'technical_manager', 'location_address'],
        excluded: ['location_gps', 'owner_producer_id', 'tenant_id', 'organization_id'],
      },

      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        if (!r.name) return null
        const typeLabel = UNIT_TYPE_LABELS[String(r.unit_type ?? '')] ?? String(r.unit_type ?? '')
        return {
          text: [
            norm(r.name) ?? '',
            typeLabel,
            norm(r.technical_manager) ?? '',
            norm(r.location_address) ?? '',
          ].filter(Boolean),
          presenter: {
            title: (norm(r.name) ?? undefined) ?? 'Unidad productiva',
            subtitle: typeLabel,
            icon: 'warehouse',
            badge: r.status as string | undefined === 'active' ? 'Activo' : r.status === 'maintenance' ? 'Mantenimiento' : 'Inactivo',
          },
          links: [{ href: `/backend/agri-units/farm-units/${r.id}`, label: 'Ver unidad', kind: 'primary' }],
          checksumSource: { name: r.name, status: r.status, updated_at: r.updated_at },
        }
      },

      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        const typeLabel = UNIT_TYPE_LABELS[String(r.unit_type ?? '')] ?? String(r.unit_type ?? '')
        return {
          title: (norm(r.name) ?? undefined) ?? 'Unidad productiva',
          subtitle: typeLabel,
          icon: 'warehouse',
          badge: r.status as string | undefined === 'active' ? 'Activo' : 'Inactivo',
        }
      },

      resolveUrl: async (ctx: SearchBuildContext): Promise<string | null> =>
        `/backend/agri-units/farm-units/${ctx.record.id}`,
    },

    // =========================================================================
    // agri_units.flock — Lotes de producción
    // Los operativos buscan por número de lote para ver el estado actual.
    // =========================================================================
    {
      entityId: 'agri_units.flock',
      enabled: true,
      priority: 50,

      fieldPolicy: {
        searchable: ['flock_number', 'species', 'genetic_line', 'status', 'supplier_lot_number'],
        excluded: ['tenant_id', 'organization_id', 'mortality_threshold_pct'],
      },

      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        if (!r.flock_number) return null
        const speciesLabel = SPECIES_LABELS[String(r.species ?? '')] ?? String(r.species ?? '')
        const statusLabel = FLOCK_STATUS_LABELS[String(r.status ?? '')] ?? String(r.status ?? '')
        return {
          text: [
            norm(r.flock_number) ?? '',
            speciesLabel,
            norm(r.genetic_line) ?? '',
            norm(r.supplier_lot_number) ?? '',
          ].filter(Boolean),
          presenter: {
            title: (norm(r.flock_number) ?? undefined) ?? 'Lote',
            subtitle: [speciesLabel, norm(r.genetic_line)].filter(Boolean).join(' · ') || undefined,
            icon: 'bird',
            badge: statusLabel,
          },
          links: [{ href: `/backend/agri-units/flocks/${r.id}`, label: 'Ver lote', kind: 'primary' }],
          checksumSource: { flock_number: r.flock_number, status: r.status, updated_at: r.updated_at },
        }
      },

      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        const speciesLabel = SPECIES_LABELS[String(r.species ?? '')] ?? String(r.species ?? '')
        const statusLabel = FLOCK_STATUS_LABELS[String(r.status ?? '')] ?? String(r.status ?? '')
        return {
          title: (norm(r.flock_number) ?? undefined) ?? 'Lote',
          subtitle: speciesLabel,
          icon: 'bird',
          badge: statusLabel,
        }
      },

      resolveUrl: async (ctx: SearchBuildContext): Promise<string | null> =>
        `/backend/agri-units/flocks/${ctx.record.id}`,
    },
  ],
}

export default searchConfig
export const config = searchConfig
