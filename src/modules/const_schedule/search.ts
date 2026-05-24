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
      entityId: 'const_schedule.task',
      enabled: true,
      priority: 15,

      fieldPolicy: {
        searchable: ['name', 'status', 'task_type'],
        excluded: [],
      },


      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        const lines: string[] = []
        if (r.name) lines.push(String(r.name))
        if (r.status) lines.push(String(r.status))
        if (r.task_type) lines.push(String(r.task_type))
        if (!lines.length) return null
        const presenter: SearchResultPresenter = {
          title: (norm(r.name as string) as string | undefined) ?? 'Name',
          subtitle: ((norm(r.status as string) ?? '') + ' · ' + (norm(r.task_type as string) ?? '')).replace(/^\s*·\s*|\s*·\s*$/g, '') || undefined,
          icon: 'calendar',
          badge: (norm(r.status as string) as string | undefined) ?? undefined,
        }
        return {
          text: lines,
          presenter,
          links: [{ href: '/backend/const_schedule', label: 'Ver cronograma', kind: 'primary' }],
          checksumSource: { name: r.name, updated_at: r.updated_at },
        }
      },

      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        return {
          title: (norm(r.name as string) as string | undefined) ?? 'Name',
          subtitle: (norm(r.status as string) as string | undefined) ?? undefined,
          icon: 'calendar',
          badge: (norm(r.status as string) as string | undefined) ?? undefined,
        }
      },

      resolveUrl: async (_ctx: SearchBuildContext): Promise<string | null> => {
        return '/backend/const_schedule'
      },
    },
  ],
}
export default searchConfig
export const config = searchConfig
