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

export const searchConfig: SearchModuleConfig = {
  entities: [
    // =========================================================================
    // isp_plans.service_plan — Planes de servicio del ISP
    // Técnicos y agentes buscan por nombre, tecnología o segmento.
    // =========================================================================
    {
      entityId: 'isp_plans:isp_service_plan',
      enabled: true,
      priority: 5,

      fieldPolicy: {
        searchable: ['name', 'technology', 'target_segment', 'radius_profile'],
        excluded: ['monthly_price_usd', 'installation_fee_usd', 'sort_order'],
      },

      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        const lines: string[] = []
        if (r.name) lines.push(`Plan: ${r.name}`)
        if (r.technology) lines.push(`Tecnología: ${r.technology}`)
        if (r.download_mbps) lines.push(`${r.download_mbps}↓/${r.upload_mbps}↑ Mbps`)
        if (r.target_segment) lines.push(`Segmento: ${r.target_segment}`)
        if (!lines.length) return null

        return {
          text: lines,
          presenter: {
            title: (norm(r.name) ?? undefined) ?? 'Plan',
            subtitle: `${r.download_mbps}/${r.upload_mbps} Mbps · USD ${r.monthly_price_usd}`,
            icon: 'zap',
            badge: String(r.technology ?? ''),
          },
          links: [{ href: '/backend/isp-plans', label: 'Ver planes', kind: 'primary' }],
          checksumSource: { name: r.name, technology: r.technology, monthly_price_usd: r.monthly_price_usd, is_active: r.is_active },
        }
      },

      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        return {
          title: (norm(r.name) ?? undefined) ?? 'Plan',
          subtitle: `${r.download_mbps}/${r.upload_mbps} Mbps · USD ${r.monthly_price_usd}`,
          icon: 'zap',
          badge: String(r.technology ?? ''),
        }
      },

      resolveUrl: async (_ctx: SearchBuildContext): Promise<string | null> => '/backend/isp-plans',
    },
  ],
}

export default searchConfig
export const config = searchConfig
