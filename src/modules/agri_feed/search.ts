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

const FORMULA_TYPE_LABELS: Record<string, string> = {
  starter:  'Iniciador', grower: 'Engorde', finisher: 'Finalizador',
  layer:    'Postura',   breeding: 'Reproductores', other: 'Otro',
}

const BATCH_STATUS_LABELS: Record<string, string> = {
  pending_analysis: 'Análisis pendiente',
  approved: 'Aprobado', rejected: 'Rechazado', consumed: 'Consumido',
}

export const searchConfig: SearchModuleConfig = {
  entities: [
    // =========================================================================
    // agri_feed.formula — Fórmulas de alimento
    // =========================================================================
    {
      entityId: 'agri_feed.formula',
      enabled: true,
      priority: 30,

      fieldPolicy: {
        searchable: ['name', 'formula_type', 'species'],
        excluded: ['ingredients', 'tenant_id', 'organization_id', 'last_bcv_rate'],
      },

      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        if (!r.name) return null
        const typeLabel = FORMULA_TYPE_LABELS[String(r.formula_type ?? '')] ?? String(r.formula_type ?? '')
        return {
          text: [norm(r.name as string) ?? '', typeLabel].filter(Boolean),
          presenter: {
            title: (norm(r.name as string) as string | undefined) ?? 'Fórmula',
            subtitle: [typeLabel, r.species !== 'all' ? (norm(r.species as string) ?? undefined) : undefined].filter(Boolean).join(' · ') || undefined,
            icon: 'wheat',
            badge: r.is_active ? 'Activa' : 'Inactiva',
          },
          links: [{ href: `/backend/agri-feed/formulas/${r.id}`, label: 'Ver fórmula', kind: 'primary' }],
          checksumSource: { name: r.name, cost_per_ton_usd: r.cost_per_ton_usd, is_active: r.is_active, updated_at: r.updated_at },
        }
      },

      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        const typeLabel = FORMULA_TYPE_LABELS[String(r.formula_type ?? '')] ?? String(r.formula_type ?? '')
        return {
          title: (norm(r.name as string) as string | undefined) ?? 'Fórmula',
          subtitle: typeLabel,
          icon: 'wheat',
          badge: r.is_active ? 'Activa' : 'Inactiva',
        }
      },

      resolveUrl: async (ctx: SearchBuildContext): Promise<string | null> =>
        `/backend/agri-feed/formulas/${ctx.record.id}`,
    },

    // =========================================================================
    // agri_feed.batch — Lotes de alimento
    // =========================================================================
    {
      entityId: 'agri_feed.batch',
      enabled: true,
      priority: 25,

      fieldPolicy: {
        searchable: ['batch_number', 'status', 'source_type', 'supplier_lot_number', 'supplier_invoice'],
        excluded: ['ingredients_used', 'tenant_id', 'organization_id'],
      },

      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        if (!r.batch_number) return null
        const statusLabel = BATCH_STATUS_LABELS[String(r.status ?? '')] ?? String(r.status ?? '')
        return {
          text: [norm(r.batch_number as string) ?? '', norm(r.supplier_lot_number as string) ?? ''].filter(Boolean),
          presenter: {
            title: (norm(r.batch_number as string) as string | undefined) ?? 'Lote',
            subtitle: [`${r.quantity_tons} t`, norm(r.source_type as string) === 'purchased' ? 'Comprado' : 'Producción propia'].filter(Boolean).join(' · '),
            icon: 'package',
            badge: statusLabel,
          },
          links: [{ href: `/backend/agri-feed/batches/${r.id}`, label: 'Ver lote', kind: 'primary' }],
          checksumSource: { batch_number: r.batch_number, status: r.status, updated_at: r.updated_at },
        }
      },

      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        const statusLabel = BATCH_STATUS_LABELS[String(r.status ?? '')] ?? String(r.status ?? '')
        return {
          title: (norm(r.batch_number as string) as string | undefined) ?? 'Lote',
          subtitle: `${r.quantity_tons} t`,
          icon: 'package',
          badge: statusLabel,
        }
      },

      resolveUrl: async (ctx: SearchBuildContext): Promise<string | null> =>
        `/backend/agri-feed/batches/${ctx.record.id}`,
    },
  ],
}

export default searchConfig
export const config = searchConfig
