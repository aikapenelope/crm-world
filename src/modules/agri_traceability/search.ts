import type {
  SearchModuleConfig, SearchBuildContext, SearchIndexSource, SearchResultPresenter,
} from '@open-mercato/shared/modules/search'

function norm(v: unknown): string | null {
  if (v == null) return null
  const s = String(v).trim()
  return s.length > 0 ? s : null
}

const RECALL_STATUS: Record<string, string> = {
  investigating: 'Investigando', executing: 'En ejecución',
  completed: 'Completado', closed: 'Cerrado',
}

export const searchConfig: SearchModuleConfig = {
  entities: [
    {
      entityId: 'agri_traceability.recall',
      enabled: true,
      priority: 60,
      fieldPolicy: { searchable: ['recall_number', 'lot_number', 'status', 'recall_class'], excluded: ['tenant_id', 'organization_id', 'approved_by', 'affected_clients'] },
      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        if (!r.recall_number) return null
        const statusLabel = RECALL_STATUS[String(r.status ?? '')] ?? String(r.status ?? '')
        return {
          text: [norm(r.recall_number) ?? '', norm(r.lot_number) ?? ''].filter(Boolean),
          presenter: {
            title: (norm(r.recall_number) ?? undefined) ?? 'Recall',
            subtitle: `Lote: ${norm(r.lot_number) ?? '—'} · Clase ${r.recall_class}`,
            icon: 'alert-triangle',
            badge: statusLabel,
          },
          links: [{ href: `/backend/agri-traceability`, label: 'Ver recall', kind: 'primary' }],
          checksumSource: { recall_number: r.recall_number, status: r.status, updated_at: r.updated_at },
        }
      },
      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        return { title: (norm(r.recall_number) ?? undefined) ?? 'Recall', subtitle: `Clase ${r.recall_class}`, icon: 'alert-triangle', badge: RECALL_STATUS[String(r.status ?? '')] ?? String(r.status ?? '') }
      },
      resolveUrl: async (_ctx: SearchBuildContext): Promise<string | null> => `/backend/agri-traceability`,
    },
  ],
}
export default searchConfig
export const config = searchConfig
