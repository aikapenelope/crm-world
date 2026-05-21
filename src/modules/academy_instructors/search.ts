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
      entityId: 'academy_instructors.instructor',
      enabled: true,
      priority: 20,

      fieldPolicy: {
        searchable: ['name', 'specialty', 'email'],
        hashOnly: ['email', 'phone'],
        excluded: ['hourly_rate_usd'],
      },


      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        const lines: string[] = []
        if (r.name) lines.push(String(r.name))
        if (r.specialty) lines.push(String(r.specialty))
        if (r.email) lines.push(String(r.email))
        if (!lines.length) return null
        const presenter: SearchResultPresenter = {
          title: norm(r.name) ?? 'Name',
          subtitle: ((norm(r.specialty) ?? '')).replace(/^\s*·\s*|\s*·\s*$/g, '') || undefined,
          icon: 'user',
        }
        return {
          text: lines,
          presenter,
          links: [{ href: '/backend/academy_instructors', label: 'Ver instructores', kind: 'primary' }],
          checksumSource: { name: r.name, updated_at: r.updated_at },
        }
      },

      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        return {
          title: norm(r.name) ?? 'Name',
          subtitle: norm(r.specialty) ?? undefined,
          icon: 'user',
        }
      },

      resolveUrl: async (_ctx: SearchBuildContext): Promise<string | null> => {
        return '/backend/academy_instructors'
      },
    },
  ],
}
export default searchConfig
export const config = searchConfig
