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

export const searchConfig: SearchModuleConfig = {
  entities: [
    {
      entityId: 'dist_commissions.rule',
      enabled: true,
      priority: 10,

      fieldPolicy: {
        searchable: ['name', 'commission_type'],
        excluded: ['rate_percent', 'fixed_amount'],
      },


      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        const lines: string[] = []
        if (r.name) lines.push(String(r.name))
        if (r.commission_type) lines.push(String(r.commission_type))
        if (!lines.length) return null
        const presenter: SearchResultPresenter = {
          title: (norm(r.name as string) as string | undefined) ?? 'Name',
          subtitle: ((norm(r.commission_type as string) ?? '')).replace(/^\s*·\s*|\s*·\s*$/g, '') || undefined,
          icon: 'percent',
        }
        return {
          text: lines,
          presenter,
          links: [{ href: '/backend/dist_commissions', label: 'Ver comisiones', kind: 'primary' }],
          checksumSource: { name: r.name, updated_at: r.updated_at },
        }
      },

      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        return {
          title: (norm(r.name as string) as string | undefined) ?? 'Name',
          subtitle: (norm(r.commission_type as string) as string | undefined) ?? undefined,
          icon: 'percent',
        }
      },

      resolveUrl: async (_ctx: SearchBuildContext): Promise<string | null> => {
        return '/backend/dist_commissions'
      },
    },
  ],
}
export default searchConfig
export const config = searchConfig
