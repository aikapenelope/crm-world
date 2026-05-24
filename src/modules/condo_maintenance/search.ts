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

const CATEGORY_LABELS: Record<string, string> = {
  plumbing: 'Plomería',
  electrical: 'Electricidad',
  elevator: 'Ascensor',
  structural: 'Estructura',
  cleaning: 'Limpieza',
  security: 'Seguridad',
  garden: 'Jardines',
  pool: 'Piscina',
  other: 'Otro',
}

const STATUS_LABELS: Record<string, string> = {
  open: 'Abierta',
  assigned: 'Asignada',
  in_progress: 'En progreso',
  completed: 'Completada',
  cancelled: 'Cancelada',
}

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  emergency: 'Emergencia',
}

export const searchConfig: SearchModuleConfig = {
  entities: [
    {
      entityId: 'condo_maintenance.request',
      enabled: true,
      priority: 20,

      fieldPolicy: {
        searchable: [
          'request_number',
          'title',
          'description',
          'category',
          'status',
          'priority',
          'requested_by_name',
          'location',
          'assigned_to',
          'resolution_notes',
        ],
        // requested_by_phone es un número de teléfono — hashOnly para búsqueda exacta
        // sin exponer el número en el índice fulltext.
        hashOnly: ['requested_by_phone'],
        excluded: ['estimated_cost', 'actual_cost', 'currency'],
      },

      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        const lines: string[] = []
        if (r.request_number) lines.push(`Solicitud: ${r.request_number}`)
        if (r.title) lines.push(`Título: ${r.title}`)
        if (r.category) lines.push(`Categoría: ${CATEGORY_LABELS[String(r.category)] ?? String(r.category)}`)
        if (r.status) lines.push(`Estado: ${STATUS_LABELS[String(r.status)] ?? String(r.status)}`)
        if (r.priority) lines.push(`Prioridad: ${PRIORITY_LABELS[String(r.priority)] ?? String(r.priority)}`)
        if (r.requested_by_name) lines.push(`Solicitado por: ${r.requested_by_name}`)
        if (r.location) lines.push(`Ubicación: ${r.location}`)
        if (r.assigned_to) lines.push(`Asignado a: ${r.assigned_to}`)
        if (r.description) lines.push(String(r.description).slice(0, 200))
        if (!lines.length) return null

        const statusLabel = STATUS_LABELS[String(r.status ?? '')] ?? String(r.status ?? '')
        const catLabel = CATEGORY_LABELS[String(r.category ?? '')] ?? String(r.category ?? '')
        const subtitle = [
          norm(r.requested_by_name as string),
          catLabel || null,
          statusLabel || null,
        ].filter(Boolean).join(' · ')

        const presenter: SearchResultPresenter = {
          title: (norm(r.title as string) as string | undefined) ?? norm(r.request_number as string) ?? 'Solicitud',
          subtitle: subtitle || undefined,
          icon: 'wrench',
          badge: statusLabel,
        }

        return {
          text: lines,
          presenter,
          links: [{ href: '/backend/condo_maintenance', label: 'Ver mantenimiento', kind: 'primary' }],
          checksumSource: {
            request_number: r.request_number,
            title: r.title,
            status: r.status,
            assigned_to: r.assigned_to,
            updated_at: r.updated_at,
          },
        }
      },

      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        const statusLabel = STATUS_LABELS[String(r.status ?? '')] ?? String(r.status ?? '')
        return {
          title: (norm(r.title as string) as string | undefined) ?? norm(r.request_number as string) ?? 'Solicitud',
          subtitle: (norm(r.requested_by_name as string) as string | undefined) ?? undefined,
          icon: 'wrench',
          badge: statusLabel,
        }
      },

      resolveUrl: async (_ctx: SearchBuildContext): Promise<string | null> => {
        return '/backend/condo_maintenance'
      },
    },
  ],
}

export default searchConfig
export const config = searchConfig
