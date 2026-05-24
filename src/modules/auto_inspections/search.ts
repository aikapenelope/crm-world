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
      entityId: 'auto_inspections.inspection',
      enabled: true,
      priority: 20,

      fieldPolicy: {
        searchable: ['inspection_number', 'overall_condition', 'inspector_name'],
        excluded: [],
      },


      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        const lines: string[] = []
        if (r.inspection_number) lines.push(String(r.inspection_number))
        if (r.overall_condition) lines.push(String(r.overall_condition))
        if (r.inspector_name) lines.push(String(r.inspector_name))
        if (!lines.length) return null
        const presenter: SearchResultPresenter = {
          title: (norm(r.inspection_number as string) as string | undefined) ?? 'Inspection Number',
          subtitle: ((norm(r.overall_condition as string) ?? '')).replace(/^\s*·\s*|\s*·\s*$/g, '') || undefined,
          icon: 'clipboard-check',
          badge: (norm(r.overall_condition as string) as string | undefined) ?? undefined,
        }
        return {
          text: lines,
          presenter,
          links: [{ href: '/backend/auto_inspections', label: 'Ver inspecciones', kind: 'primary' }],
          checksumSource: { inspection_number: r.inspection_number, updated_at: r.updated_at },
        }
      },

      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        return {
          title: (norm(r.inspection_number as string) as string | undefined) ?? 'Inspection Number',
          subtitle: (norm(r.overall_condition as string) as string | undefined) ?? undefined,
          icon: 'clipboard-check',
          badge: (norm(r.overall_condition as string) as string | undefined) ?? undefined,
        }
      },

      resolveUrl: async (_ctx: SearchBuildContext): Promise<string | null> => {
        return '/backend/auto_inspections'
      },
    },
  ],
}
export default searchConfig
export const config = searchConfig
