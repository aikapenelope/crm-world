import type {
  SearchModuleConfig,
  SearchBuildContext,
  SearchIndexSource,
  SearchResultPresenter,
  SearchResultLink,
} from '@open-mercato/shared/modules/search'

function norm(v: unknown): string | null {
  if (v == null) return null
  const s = String(v).trim()
  return s.length > 0 ? s : null
}

// Searches const_rfis and const_submittals

const RFI_STATUS: Record<string, string> = {
  open: 'Abierta', pending_response: 'Pendiente', answered: 'Respondida',
  closed: 'Cerrada', void: 'Anulada',
}

export const searchConfig: SearchModuleConfig = {
  entities: [
    {
      entityId: 'const_rfis:rfi',
      enabled: true,
      priority: 15,

      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        const lines: string[] = []
        if (r.rfi_number) lines.push(`RFI: ${r.rfi_number}`)
        if (r.subject) lines.push(`Asunto: ${r.subject}`)
        if (r.description) lines.push(String(r.description).slice(0, 300))
        if (r.discipline) lines.push(`Disciplina: ${r.discipline}`)
        if (r.submitted_by) lines.push(`Enviado por: ${r.submitted_by}`)
        if (r.assigned_to) lines.push(`Asignado a: ${r.assigned_to}`)
        if (r.linked_drawing) lines.push(`Plano: ${r.linked_drawing}`)
        if (r.answer) lines.push(`Respuesta: ${String(r.answer).slice(0, 200)}`)
        if (!lines.length) return null

        const presenter: SearchResultPresenter = {
          title: String(r.subject ?? r.rfi_number ?? 'RFI'),
          subtitle: [norm(r.rfi_number as string), norm(r.discipline as string)].filter(Boolean).join(' · ') || undefined,
          icon: 'help-circle',
          badge: RFI_STATUS[String(r.status)] ?? undefined,
        }

        return {
          text: lines,
          presenter,
          links: [{ href: `/backend/const_rfis`, label: 'Ver RFIs', kind: 'primary' }],
          checksumSource: { subject: r.subject, status: r.status, answered_at: r.answered_at, updated_at: r.updated_at },
        }
      },

      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        return {
          title: String(r.subject ?? r.rfi_number ?? 'RFI'),
          subtitle: [norm(r.rfi_number as string), norm(r.discipline as string)].filter(Boolean).join(' · ') || undefined,
          icon: 'help-circle',
          badge: RFI_STATUS[String(r.status)] ?? undefined,
        }
      },

      resolveUrl: async (_ctx: SearchBuildContext): Promise<string | null> => {
        return `/backend/const_rfis`
      },

      resolveLinks: async (_ctx: SearchBuildContext): Promise<SearchResultLink[] | null> => {
        return [{ href: `/backend/const_rfis`, label: 'Ver todos los RFIs', kind: 'secondary' }]
      },

      fieldPolicy: {
        searchable: ['rfi_number', 'subject', 'description', 'discipline', 'submitted_by', 'assigned_to', 'linked_drawing', 'answer'],
        hashOnly: ['cost_impact', 'schedule_impact_days'],
        excluded: [],
      },
    },
  ],
}

export default searchConfig
export const config = searchConfig
