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

const STATUS_LABELS: Record<string, string> = {
  present: 'Presente', absent: 'Ausente', late: 'Tardanza',
  excused: 'Justificado', remote: 'Remoto',
}

export const searchConfig: SearchModuleConfig = {
  entities: [
    // =========================================================================
    // attendance.record — Registros de asistencia
    // Directivos buscan por fecha para revisar el estado del día.
    // La búsqueda se hace por fecha (YYYY-MM-DD) como identificador natural.
    // =========================================================================
    {
      entityId: 'attendance:attendance_record',
      enabled: true,
      priority: 10,

      fieldPolicy: {
        searchable: ['date', 'status'],
        excluded: [],
      },

      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        if (!r.date) return null

        const dateStr = String(r.date).slice(0, 10)
        const statusLabel = STATUS_LABELS[String(r.status ?? '')] ?? String(r.status ?? '')

        return {
          text: [`Asistencia: ${dateStr}`, statusLabel],
          presenter: {
            title: dateStr,
            subtitle: statusLabel,
            icon: 'clipboard-check',
            badge: statusLabel,
          },
          links: [{ href: '/backend/attendance', label: 'Ver asistencia', kind: 'primary' }],
          checksumSource: { date: r.date, status: r.status },
        }
      },

      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        const statusLabel = STATUS_LABELS[String(r.status ?? '')] ?? String(r.status ?? '')
        return {
          title: String(r.date ?? '').slice(0, 10),
          subtitle: statusLabel,
          icon: 'clipboard-check',
          badge: statusLabel,
        }
      },

      resolveUrl: async (_ctx: SearchBuildContext): Promise<string | null> =>
        '/backend/attendance',
    },
  ],
}

export default searchConfig
export const config = searchConfig
