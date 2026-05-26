import type {
  SearchModuleConfig, SearchBuildContext, SearchIndexSource, SearchResultPresenter,
} from '@open-mercato/shared/modules/search'

function norm(v: unknown): string | null {
  if (v == null) return null
  const s = String(v).trim()
  return s.length > 0 ? s : null
}

const STATUS_LABEL: Record<string, string> = {
  draft: 'Borrador', active: 'Activo', superseded: 'Reemplazado', archived: 'Archivado',
}
const TYPE_LABEL: Record<string, string> = {
  process: 'Por procesos', discrete: 'Discreto',
}

export const searchConfig: SearchModuleConfig = {
  entities: [
    {
      entityId: 'mfg_bom.mfg_bom_header',
      enabled: true,
      priority: 45,
      fieldPolicy: {
        searchable: ['product_code', 'product_name', 'version', 'status', 'bom_type'],
        excluded: ['tenant_id', 'organization_id', 'product_id'],
      },
      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        if (!r.product_code) return null
        const statusLabel = STATUS_LABEL[String(r.status ?? '')] ?? String(r.status ?? '')
        return {
          text: [norm(r.product_code) ?? '', norm(r.product_name) ?? ''].filter(Boolean),
          presenter: {
            title: `${norm(r.product_code)} — ${norm(r.product_name) ?? ''}`,
            subtitle: `${TYPE_LABEL[String(r.bom_type ?? '')] ?? String(r.bom_type ?? '')} · v${r.version}`,
            icon: 'layers',
            badge: statusLabel,
          },
          links: [{ href: `/backend/mfg-bom/${r.id}`, label: 'Ver BOM', kind: 'primary' }],
          checksumSource: { product_code: r.product_code, version: r.version, status: r.status, updated_at: r.updated_at },
        }
      },
      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        return {
          title: `${norm(r.product_code)} — ${norm(r.product_name) ?? ''}`,
          subtitle: `v${r.version}`,
          icon: 'layers',
          badge: STATUS_LABEL[String(r.status ?? '')] ?? String(r.status ?? ''),
        }
      },
      resolveUrl: async (ctx: SearchBuildContext): Promise<string | null> =>
        `/backend/mfg-bom/${ctx.record.id}`,
    },
  ],
}
export default searchConfig
export const config = searchConfig
