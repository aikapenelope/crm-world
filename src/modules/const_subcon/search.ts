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
      entityId: 'const_subcon.subcontractor',
      enabled: true,
      priority: 25,

      fieldPolicy: {
        searchable: ['name', 'specialty', 'contact_name', 'city'],
        hashOnly: ['rif', 'phone'],
        excluded: ['hourly_rate'],
      },


      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        const lines: string[] = []
        if (r.name) lines.push(String(r.name))
        if (r.specialty) lines.push(String(r.specialty))
        if (r.contact_name) lines.push(String(r.contact_name))
        if (r.city) lines.push(String(r.city))
        if (!lines.length) return null
        const presenter: SearchResultPresenter = {
          title: norm(r.name) ?? 'Name',
          subtitle: ((norm(r.specialty) ?? '') + ' · ' + (norm(r.city) ?? '')).replace(/^\s*·\s*|\s*·\s*$/g, '') || undefined,
          icon: 'hard-hat',
          badge: norm(r.specialty) ?? undefined,
        }
        return {
          text: lines,
          presenter,
          links: [{ href: '/backend/const_subcon', label: 'Ver subcontratistas', kind: 'primary' }],
          checksumSource: { name: r.name, updated_at: r.updated_at },
        }
      },

      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        return {
          title: norm(r.name) ?? 'Name',
          subtitle: norm(r.specialty) ?? undefined,
          icon: 'hard-hat',
          badge: norm(r.specialty) ?? undefined,
        }
      },

      resolveUrl: async (_ctx: SearchBuildContext): Promise<string | null> => {
        return '/backend/const_subcon'
      },
    },
  ],
}
export default searchConfig
export const config = searchConfig
