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
// school_docs.template — Plantillas de constancias escolares
// Secretaría busca plantillas por título para emitir documentos.
// =========================================================================
export const searchConfig: SearchModuleConfig = {
  entities: [{
    entityId: 'school_docs.template',
    enabled: true,
    priority: 10,
    fieldPolicy: {
      searchable: ['title'],
      excluded: ['body_template'],
    },
    buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
      const r = ctx.record
      if (!r.title) return null
      return {
        text: [String(r.title)],
        presenter: {
          title: norm(r.title) ?? 'Plantilla',
          icon: 'file-text',
          badge: norm(r.doc_type) ?? undefined,
        },
        links: [{ href: '/backend/school-docs', label: 'Ver constancias', kind: 'primary' }],
        checksumSource: { title: r.title, updated_at: r.updated_at },
      }
    },
    formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
      const r = ctx.record
      return {
        title: norm(r.title) ?? 'Plantilla',
        icon: 'file-text',
      }
    },
    resolveUrl: async (_ctx: SearchBuildContext): Promise<string | null> => '/backend/school-docs',
  }],
}

export default searchConfig
export const config = searchConfig
