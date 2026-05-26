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
  open: 'Abierto', assigned: 'Asignado', in_progress: 'En proceso',
  pending_client: 'Pendiente', resolved: 'Resuelto', closed: 'Cerrado',
}
const TYPE_LABELS: Record<string, string> = {
  fault: 'Avería', inquiry: 'Consulta', plan_change: 'Cambio plan',
  move: 'Mudanza', new_service: 'Nuevo servicio', complaint: 'Queja',
}

export const searchConfig: SearchModuleConfig = {
  entities: [
    // =========================================================================
    // isp_support.ticket — Tickets de soporte técnico
    // Técnicos y supervisores buscan por número de ticket o asunto.
    // =========================================================================
    {
      entityId: 'isp_support.isp_support_ticket',
      enabled: true,
      priority: 40,

      fieldPolicy: {
        searchable: ['ticket_number', 'subject', 'type', 'status', 'priority', 'description'],
        excluded: ['sla_hours', 'sla_breached'],
      },

      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        const lines: string[] = []
        if (r.ticket_number) lines.push(`Ticket: ${r.ticket_number}`)
        if (r.subject) lines.push(String(r.subject))
        if (r.type) lines.push(`Tipo: ${TYPE_LABELS[String(r.type)] ?? r.type}`)
        if (!lines.length) return null

        const statusLabel = STATUS_LABELS[String(r.status ?? '')] ?? String(r.status ?? '')
        const PRIORITY_ICON: Record<string, string> = { critical: '🔴', high: '🟠', normal: '', low: '🔵' }
        const priorityIcon = PRIORITY_ICON[String(r.priority ?? '')] ?? ''

        return {
          text: lines,
          presenter: {
            title: `${priorityIcon} ${norm(r.ticket_number) ?? 'Ticket'}`.trim(),
            subtitle: (norm(r.subject) ?? undefined) ?? undefined,
            icon: 'message-circle',
            badge: statusLabel,
          },
          links: [{ href: `/backend/isp-support/${r.id}`, label: 'Ver ticket', kind: 'primary' }],
          checksumSource: { ticket_number: r.ticket_number, status: r.status, subject: r.subject, updated_at: r.updated_at },
        }
      },

      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        const statusLabel = STATUS_LABELS[String(r.status ?? '')] ?? String(r.status ?? '')
        return {
          title: (norm(r.ticket_number) ?? undefined) ?? 'Ticket',
          subtitle: (norm(r.subject) ?? undefined) ?? undefined,
          icon: 'message-circle',
          badge: statusLabel,
        }
      },

      resolveUrl: async (ctx: SearchBuildContext): Promise<string | null> =>
        `/backend/isp-support/${ctx.record.id}`,
    },
  ],
}

export default searchConfig
export const config = searchConfig
