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
    // isp_network.node — Nodos de red
    // Técnicos y administradores buscan por nombre de nodo, ciudad o estado.
    // =========================================================================
    {
      entityId: 'isp_network.isp_network_node',
      enabled: true,
      priority: 15,

      fieldPolicy: {
        searchable: ['name', 'city', 'node_type', 'status', 'equipment_model', 'monitoring_host'],
        excluded: ['coordinates_lat', 'coordinates_lng', 'total_capacity_mbps', 'used_capacity_mbps'],
      },

      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        const lines: string[] = []
        if (r.name) lines.push(`Nodo: ${r.name}`)
        if (r.city) lines.push(`Ciudad: ${r.city}`)
        if (r.node_type) lines.push(`Tipo: ${r.node_type}`)
        if (r.equipment_model) lines.push(`Equipo: ${r.equipment_model}`)
        if (r.monitoring_host) lines.push(`Host NMS: ${r.monitoring_host}`)
        if (!lines.length) return null

        const STATUS_ICON: Record<string, string> = { active: '🟢', degraded: '🟡', offline: '🔴', maintenance: '🔧' }
        const statusIcon = STATUS_ICON[String(r.status ?? '')] ?? ''

        return {
          text: lines,
          presenter: {
            title: `${statusIcon} ${norm(r.name) ?? 'Nodo'}`,
            subtitle: [norm(r.city), norm(r.node_type)].filter(Boolean).join(' · ') || undefined,
            icon: 'wifi',
            badge: String(r.status ?? ''),
          },
          links: [{ href: `/backend/isp-network/${r.id}`, label: 'Ver nodo', kind: 'primary' }],
          checksumSource: { name: r.name, status: r.status, city: r.city, used_capacity_mbps: r.used_capacity_mbps },
        }
      },

      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        return {
          title: (norm(r.name) ?? undefined) ?? 'Nodo',
          subtitle: [norm(r.city), norm(r.node_type)].filter(Boolean).join(' · ') || undefined,
          icon: 'wifi',
          badge: String(r.status ?? ''),
        }
      },

      resolveUrl: async (ctx: SearchBuildContext): Promise<string | null> =>
        `/backend/isp-network/${ctx.record.id}`,
    },

    // =========================================================================
    // isp_network.cpe — Inventario de equipos CPE
    // Técnicos buscan por número de serie, MAC o modelo antes de salir.
    // =========================================================================
    {
      entityId: 'isp_network.isp_cpe_inventory',
      enabled: true,
      priority: 10,

      fieldPolicy: {
        searchable: ['serial_number', 'mac_address', 'brand', 'model', 'cpe_type', 'status'],
        hashOnly: ['mac_address'],
        excluded: ['purchase_price_usd'],
      },

      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        const lines: string[] = []
        if (r.brand) lines.push(String(r.brand))
        if (r.model) lines.push(String(r.model))
        if (r.serial_number) lines.push(`S/N: ${r.serial_number}`)
        if (r.mac_address) lines.push(`MAC: ${r.mac_address}`)
        if (!lines.length) return null

        return {
          text: lines,
          presenter: {
            title: `${norm(r.brand) ?? ''} ${norm(r.model) ?? ''}`.trim() || 'CPE',
            subtitle: (norm(r.serial_number) ?? undefined) ?? undefined,
            icon: 'router',
            badge: String(r.status ?? ''),
          },
          links: [{ href: `/backend/isp-network/cpe/${r.id}`, label: 'Ver equipo', kind: 'primary' }],
          checksumSource: { serial_number: r.serial_number, status: r.status, model: r.model },
        }
      },

      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        return {
          title: `${norm(r.brand) ?? ''} ${norm(r.model) ?? ''}`.trim() || 'CPE',
          subtitle: (norm(r.serial_number) ?? undefined) ?? undefined,
          icon: 'router',
          badge: String(r.status ?? ''),
        }
      },

      resolveUrl: async (ctx: SearchBuildContext): Promise<string | null> =>
        `/backend/isp-network/cpe/${ctx.record.id}`,
    },
  ],
}

export default searchConfig
export const config = searchConfig
