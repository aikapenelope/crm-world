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
  draft: 'Borrador',
  submitted: 'Enviada',
  approved: 'Aprobada',
  invoiced: 'Facturada',
  paid: 'Pagada',
  rejected: 'Rechazada',
}

export const searchConfig: SearchModuleConfig = {
  entities: [
    // =========================================================================
    // const_progress.valuation — Valuaciones de obra (cobros parciales)
    // Los directores de obra buscan valuaciones por número, estado o período.
    // =========================================================================
    {
      entityId: 'const_progress.valuation',
      enabled: true,
      priority: 20,

      fieldPolicy: {
        searchable: ['valuation_number', 'status', 'approved_by', 'invoice_number', 'notes'],
        // Los montos son datos financieros de contratos — no exponer en fulltext
        excluded: ['total_contract', 'previous_billed', 'current_period', 'retention_amount',
          'advance_deduction', 'net_payable', 'exchange_rate', 'amount_ves', 'currency'],
      },

      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        const lines: string[] = []

        // Intentar obtener nombre del proyecto
        let projectName: string | null = null
        if (r.project_id) {
          try {
            const em = (ctx as any).resolve?.('em')
            if (em) {
              const kysely = (em as any).getKysely?.()
              if (kysely) {
                const project = await kysely
                  .selectFrom('const_projects')
                  .select(['name', 'project_number'])
                  .where('id', '=', r.project_id)
                  .executeTakeFirst()
                if (project) {
                  projectName = norm(project.name)
                  if (project.project_number) lines.push(`Proyecto: ${project.project_number}`)
                  if (project.name) lines.push(`Obra: ${project.name}`)
                }
              }
            }
          } catch {
            // Best-effort
          }
        }

        if (r.valuation_number) lines.push(`Valuación: ${r.valuation_number}`)
        if (r.status) lines.push(`Estado: ${STATUS_LABELS[String(r.status)] ?? String(r.status)}`)
        if (r.invoice_number) lines.push(`Factura: ${r.invoice_number}`)
        if (r.approved_by) lines.push(`Aprobado por: ${r.approved_by}`)
        if (!lines.length) return null

        const statusLabel = STATUS_LABELS[String(r.status ?? '')] ?? String(r.status ?? '')
        const subtitle = [
          projectName,
          r.period_from && r.period_to
            ? `${String(r.period_from).slice(0, 7)} → ${String(r.period_to).slice(0, 7)}`
            : null,
          statusLabel,
        ].filter(Boolean).join(' · ')

        const presenter: SearchResultPresenter = {
          title: (norm(r.valuation_number) as string | undefined) ?? 'Valuación',
          subtitle: subtitle || undefined,
          icon: 'file-text',
          badge: statusLabel,
        }

        return {
          text: lines,
          presenter,
          links: [{ href: '/backend/const_progress', label: 'Ver valuaciones', kind: 'primary' }],
          checksumSource: {
            valuation_number: r.valuation_number,
            status: r.status,
            project_id: r.project_id,
            invoice_number: r.invoice_number,
            updated_at: r.updated_at,
          },
        }
      },

      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        const statusLabel = STATUS_LABELS[String(r.status ?? '')] ?? String(r.status ?? '')
        return {
          title: (norm(r.valuation_number) as string | undefined) ?? 'Valuación',
          subtitle: statusLabel || undefined,
          icon: 'file-text',
          badge: statusLabel,
        }
      },

      resolveUrl: async (_ctx: SearchBuildContext): Promise<string | null> => {
        return '/backend/const_progress'
      },
    },
  ],
}

export default searchConfig
export const config = searchConfig
