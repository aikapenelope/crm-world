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
      entityId: 'academy_groups.academy_group',
      enabled: true,
      priority: 25,

      fieldPolicy: {
        searchable: ['group_code', 'status', 'schedule_time'],
        excluded: [],
      },


      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        const lines: string[] = []
        if (r.group_code) lines.push(String(r.group_code))
        if (r.status) lines.push(String(r.status))
        if (r.schedule_time) lines.push(String(r.schedule_time))
        if (!lines.length) return null
        const presenter: SearchResultPresenter = {
          title: (norm(r.group_code) ?? undefined) ?? 'Group Code',
          subtitle: ((norm(r.status) ?? '')).replace(/^\s*·\s*|\s*·\s*$/g, '') || undefined,
          icon: 'calendar',
          badge: (norm(r.status) ?? undefined) ?? undefined,
        }
        return {
          text: lines,
          presenter,
          links: [{ href: '/backend/academy_groups/[id]', label: 'Ver grupo', kind: 'primary' }],
          checksumSource: { group_code: r.group_code, updated_at: r.updated_at },
        }
      },

      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        return {
          title: (norm(r.group_code) ?? undefined) ?? 'Group Code',
          subtitle: (norm(r.status) ?? undefined) ?? undefined,
          icon: 'calendar',
          badge: (norm(r.status) ?? undefined) ?? undefined,
        }
      },

      resolveUrl: async (ctx: SearchBuildContext): Promise<string | null> => {
        const id = ctx.record.id
        return id ? `/backend/academy_groups/${encodeURIComponent(String(id))}`  : '/backend/academy_groups/'
      },
    },
  ],
}
export default searchConfig
export const config = searchConfig
