import type {
  SearchModuleConfig, SearchBuildContext, SearchIndexSource, SearchResultPresenter,
} from '@open-mercato/shared/modules/search'

function norm(v: unknown): string | null {
  if (v == null) return null
  const s = String(v).trim()
  return s.length > 0 ? s : null
}

const NC_STATUS: Record<string, string> = {
  open: 'Abierta', under_review: 'En revisión', pending_disposition: 'Pendiente disposición',
  resolved: 'Resuelta', closed: 'Cerrada',
}

export const searchConfig: SearchModuleConfig = {
  entities: [
    {
      entityId: 'mfg_quality:mfg_nonconformance',
      enabled: true,
      priority: 45,
      fieldPolicy: {
        searchable: ['nc_number', 'source', 'product_code', 'severity', 'status', 'description'],
        excluded: ['tenant_id', 'organization_id', 'lot_id', 'order_id', 'product_id', 'inspection_id'],
      },
      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        if (!r.nc_number) return null
        const statusLabel = NC_STATUS[String(r.status ?? '')] ?? String(r.status ?? '')
        return {
          text: [norm(r.nc_number) ?? '', norm(r.product_code) ?? '', norm(r.description) ?? ''].filter(Boolean),
          presenter: {
            title: `${norm(r.nc_number)} — ${norm(r.product_code) ?? 'Sin producto'}`,
            subtitle: `${r.severity} · ${r.source}`,
            icon: 'x-octagon',
            badge: statusLabel,
          },
          links: [{ href: `/backend/mfg-quality/${r.id}`, label: 'Ver NC', kind: 'primary' }],
          checksumSource: { nc_number: r.nc_number, status: r.status, updated_at: r.updated_at },
        }
      },
      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        return {
          title: (norm(r.nc_number) ?? undefined) ?? 'NC',
          subtitle: (norm(r.product_code) ?? undefined) ?? undefined,
          icon: 'x-octagon',
          badge: NC_STATUS[String(r.status ?? '')] ?? String(r.status ?? ''),
        }
      },
      resolveUrl: async (ctx: SearchBuildContext): Promise<string | null> =>
        `/backend/mfg-quality/${ctx.record.id}`,
    },
  ],
}
export default searchConfig
export const config = searchConfig
