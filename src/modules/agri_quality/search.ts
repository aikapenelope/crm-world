import type {
  SearchModuleConfig, SearchBuildContext, SearchIndexSource, SearchResultPresenter,
} from '@open-mercato/shared/modules/search'

function norm(v: unknown): string | null {
  if (v == null) return null
  const s = String(v).trim()
  return s.length > 0 ? s : null
}

const NC_STATUS: Record<string, string> = {
  open: 'Abierta', investigating: 'En investigación', pending_decision: 'Pendiente decisión',
  resolved: 'Resuelta', closed: 'Cerrada',
}

export const searchConfig: SearchModuleConfig = {
  entities: [
    {
      entityId: 'agri_quality.non_conformity',
      enabled: true,
      priority: 40,
      fieldPolicy: { searchable: ['nc_number', 'source', 'severity', 'status', 'description'], excluded: ['tenant_id', 'organization_id', 'detected_by', 'decision_by'] },
      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        if (!r.nc_number) return null
        const statusLabel = NC_STATUS[String(r.status ?? '')] ?? String(r.status ?? '')
        return {
          text: [norm(r.nc_number as string) ?? '', norm(r.description as string) ?? ''].filter(Boolean),
          presenter: { title: norm(r.nc_number) ?? 'No-conformidad', subtitle: norm(r.description)?.slice(0, 80) ?? undefined, icon: 'file-warning', badge: statusLabel },
          links: [{ href: `/backend/agri-quality/non-conformities/${r.id}`, label: 'Ver NC', kind: 'primary' }],
          checksumSource: { nc_number: r.nc_number, status: r.status, updated_at: r.updated_at },
        }
      },
      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        return { title: (norm(r.nc_number as string) as string | undefined) ?? 'NC', subtitle: NC_STATUS[String(r.status ?? '')] ?? String(r.status ?? ''), icon: 'file-warning', badge: NC_STATUS[String(r.status ?? '')] ?? '' }
      },
      resolveUrl: async (ctx: SearchBuildContext): Promise<string | null> => `/backend/agri-quality/non-conformities/${ctx.record.id}`,
    },
  ],
}

export default searchConfig
export const config = searchConfig
