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
// school_calendar.event — Eventos del calendario escolar
// Coordinadores buscan eventos por título o fechas clave.
// =========================================================================
export const searchConfig: SearchModuleConfig = {
  entities: [{
    entityId: 'school_calendar.school_event',
    enabled: true,
    priority: 10,
    fieldPolicy: {
      searchable: ['title', 'event_type'],
      excluded: [],
    },
    buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
      const r = ctx.record
      if (!r.title) return null
      const dateRange = r.start_date ? `${String(r.start_date).slice(0, 10)}${r.end_date ? ` → ${String(r.end_date).slice(0, 10)}` : ''}` : ''
      return {
        text: [String(r.title), dateRange].filter(Boolean),
        presenter: {
          title: (norm(r.title) ?? undefined) ?? 'Evento',
          subtitle: dateRange || undefined,
          icon: 'calendar',
          badge: (norm(r.event_type) ?? undefined) ?? undefined,
        },
        links: [{ href: '/backend/school-calendar', label: 'Ver calendario', kind: 'primary' }],
        checksumSource: { title: r.title, start_date: r.start_date, end_date: r.end_date },
      }
    },
    formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
      const r = ctx.record
      return {
        title: (norm(r.title) ?? undefined) ?? 'Evento',
        subtitle: r.start_date ? String(r.start_date).slice(0, 10) : undefined,
        icon: 'calendar',
      }
    },
    resolveUrl: async (_ctx: SearchBuildContext): Promise<string | null> => '/backend/school-calendar',
  }],
}

export default searchConfig
export const config = searchConfig
