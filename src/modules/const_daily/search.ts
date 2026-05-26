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
  draft: 'Borrador', submitted: 'Enviado', approved: 'Aprobado',
  rejected: 'Rechazado',
}

export const searchConfig: SearchModuleConfig = {
  entities: [
    // =========================================================================
    // const_daily.report — Reportes diarios de obra (RDO)
    // Residente de obra y directores buscan por fecha o estado.
    // =========================================================================
    {
      entityId: 'const_daily:const_daily_report',
      enabled: true,
      priority: 15,

      fieldPolicy: {
        searchable: ['report_date', 'status'],
        excluded: [],
      },

      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        if (!r.report_date) return null

        const dateStr = String(r.report_date).slice(0, 10)
        const statusLabel = STATUS_LABELS[String(r.status ?? '')] ?? String(r.status ?? '')

        return {
          text: [`RDO: ${dateStr}`, statusLabel],
          presenter: {
            title: `RDO ${dateStr}`,
            subtitle: statusLabel,
            icon: 'hard-hat',
            badge: statusLabel,
          },
          links: [{ href: '/backend/const-daily', label: 'Ver reportes', kind: 'primary' }],
          checksumSource: { report_date: r.report_date, status: r.status },
        }
      },

      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        const statusLabel = STATUS_LABELS[String(r.status ?? '')] ?? String(r.status ?? '')
        return {
          title: `RDO ${String(r.report_date ?? '').slice(0, 10)}`,
          subtitle: statusLabel,
          icon: 'hard-hat',
          badge: statusLabel,
        }
      },

      resolveUrl: async (_ctx: SearchBuildContext): Promise<string | null> =>
        '/backend/const-daily',
    },
  ],
}

export default searchConfig
export const config = searchConfig
