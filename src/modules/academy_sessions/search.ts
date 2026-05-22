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
  scheduled: 'Programada', in_progress: 'En curso', completed: 'Completada',
  cancelled: 'Cancelada', makeup: 'Recuperación',
}

const TYPE_LABELS: Record<string, string> = {
  theory: 'Teoría', practice: 'Práctica', exam: 'Examen',
  orientation: 'Orientación', makeup: 'Recuperación',
}

export const searchConfig: SearchModuleConfig = {
  entities: [
    // =========================================================================
    // academy_sessions.session — Sesiones de clases
    // Instructores y admin buscan por número de sesión o estado.
    // =========================================================================
    {
      entityId: 'academy_sessions.session',
      enabled: true,
      priority: 15,

      fieldPolicy: {
        searchable: ['session_number', 'status', 'session_type', 'topic'],
        excluded: ['coordinates_lat', 'coordinates_lng'],
      },

      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        const lines: string[] = []
        if (r.session_number) lines.push(`Sesión #${r.session_number}`)
        if (r.session_date) lines.push(`Fecha: ${String(r.session_date).slice(0, 10)}`)
        if (r.topic) lines.push(String(r.topic))
        if (!lines.length) return null

        const statusLabel = STATUS_LABELS[String(r.status ?? '')] ?? String(r.status ?? '')
        const typeLabel = TYPE_LABELS[String(r.session_type ?? '')] ?? norm(r.session_type) ?? undefined

        return {
          text: lines,
          presenter: {
            title: `Sesión #${r.session_number}`,
            subtitle: [String(r.session_date ?? '').slice(0, 10), typeLabel].filter(Boolean).join(' · ') || undefined,
            icon: 'calendar',
            badge: statusLabel,
          },
          links: [{ href: `/backend/academy-sessions/${r.id}`, label: 'Ver sesión', kind: 'primary' }],
          checksumSource: {
            session_number: r.session_number,
            status: r.status,
            session_date: r.session_date,
          },
        }
      },

      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        const statusLabel = STATUS_LABELS[String(r.status ?? '')] ?? String(r.status ?? '')
        return {
          title: `Sesión #${r.session_number}`,
          subtitle: String(r.session_date ?? '').slice(0, 10) || undefined,
          icon: 'calendar',
          badge: statusLabel,
        }
      },

      resolveUrl: async (ctx: SearchBuildContext): Promise<string | null> =>
        `/backend/academy-sessions/${ctx.record.id}`,
    },
  ],
}

export default searchConfig
export const config = searchConfig
