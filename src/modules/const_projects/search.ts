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

const STATUS_LABELS: Record<string, string> = {
  prospect: 'Prospecto', bidding: 'Licitación', awarded: 'Adjudicado',
  in_progress: 'En Ejecución', on_hold: 'Pausado', completed: 'Completado', cancelled: 'Cancelado',
}

export const searchConfig: SearchModuleConfig = {
  entities: [
    {
      entityId: 'const_projects:project',
      enabled: true,
      priority: 20,

      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        const lines: string[] = []
        if (r.name) lines.push(`Proyecto: ${r.name}`)
        if (r.code) lines.push(`Código: ${r.code}`)
        if (r.client_name) lines.push(`Cliente: ${r.client_name}`)
        if (r.project_manager) lines.push(`Director: ${r.project_manager}`)
        if (r.site_supervisor) lines.push(`Residente: ${r.site_supervisor}`)
        if (r.city) lines.push(`Ciudad: ${r.city}`)
        if (r.state) lines.push(`Estado: ${r.state}`)
        if (r.contract_number) lines.push(`Contrato: ${r.contract_number}`)
        if (r.description) lines.push(String(r.description).slice(0, 200))
        if (!lines.length) return null

        const subtitle = [
          norm(r.client_name as string),
          norm(r.city as string),
          r.contract_amount ? `${r.currency} ${Number(r.contract_amount).toLocaleString('es-VE')}` : null,
        ].filter(Boolean).join(' · ')

        const presenter: SearchResultPresenter = {
          title: String(r.name ?? 'Proyecto'),
          subtitle: subtitle || undefined,
          icon: 'hard-hat',
          badge: STATUS_LABELS[String(r.status)] ?? norm(r.status as string) ?? undefined,
        }

        const links: SearchResultLink[] = r.id
          ? [{ href: `/backend/const_projects`, label: 'Ver proyectos', kind: 'primary' }]
          : []

        return {
          text: lines,
          presenter,
          links,
          checksumSource: {
            name: r.name, code: r.code, client_name: r.client_name,
            status: r.status, contract_amount: r.contract_amount, updated_at: r.updated_at,
          },
        }
      },

      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        const subtitle = [norm(r.client_name as string), norm(r.city as string)].filter(Boolean).join(' · ')
        return {
          title: String(r.name ?? 'Proyecto'),
          subtitle: subtitle || undefined,
          icon: 'hard-hat',
          badge: STATUS_LABELS[String(r.status)] ?? undefined,
        }
      },

      resolveUrl: async (_ctx: SearchBuildContext): Promise<string | null> => {
        return `/backend/const_projects`
      },

      resolveLinks: async (_ctx: SearchBuildContext): Promise<SearchResultLink[] | null> => {
        return [
          { href: `/backend/const_progress`, label: 'Valuaciones', kind: 'secondary' },
          { href: `/backend/const_rfis`, label: 'RFIs', kind: 'secondary' },
        ]
      },

      fieldPolicy: {
        searchable: ['name', 'code', 'client_name', 'project_manager', 'site_supervisor', 'city', 'state', 'contract_number', 'description'],
        hashOnly: ['contract_amount', 'overall_progress'],
        excluded: ['metadata', 'notes'],
      },
    },
  ],
}

export default searchConfig
export const config = searchConfig
