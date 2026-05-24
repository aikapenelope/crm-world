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

// =========================================================================
// school_comms.announcement — Comunicados escolares
// Directivos buscan comunicados por título para compartirlos o revisarlos.
// =========================================================================
export const searchConfig: SearchModuleConfig = {
  entities: [{
    entityId: 'school_comms.announcement',
    enabled: true,
    priority: 15,
    fieldPolicy: {
      searchable: ['title'],
      excluded: ['body'],
    },
    buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
      const r = ctx.record
      if (!r.title) return null
      return {
        text: [String(r.title)],
        presenter: {
          title: (norm(r.title as string) as string | undefined) ?? 'Comunicado',
          subtitle: r.created_at ? new Date(String(r.created_at)).toLocaleDateString('es-VE') : undefined,
          icon: 'megaphone',
        },
        links: [{ href: '/backend/school-comms', label: 'Ver comunicados', kind: 'primary' }],
        checksumSource: { title: r.title, created_at: r.created_at },
      }
    },
    formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
      const r = ctx.record
      return {
        title: (norm(r.title as string) as string | undefined) ?? 'Comunicado',
        icon: 'megaphone',
      }
    },
    resolveUrl: async (_ctx: SearchBuildContext): Promise<string | null> => '/backend/school-comms',
  }],
}

export default searchConfig
export const config = searchConfig
