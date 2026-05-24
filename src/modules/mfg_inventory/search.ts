import type {
  SearchModuleConfig, SearchBuildContext, SearchIndexSource, SearchResultPresenter,
} from '@open-mercato/shared/modules/search'

function norm(v: unknown): string | null {
  if (v == null) return null
  const s = String(v).trim()
  return s.length > 0 ? s : null
}

const LOT_STATUS: Record<string, string> = {
  quarantine: 'Cuarentena', available: 'Disponible', reserved: 'Reservado',
  consumed: 'Consumido', expired: 'Vencido', rejected: 'Rechazado',
}

export const searchConfig: SearchModuleConfig = {
  entities: [
    {
      entityId: 'mfg_inventory.lot',
      enabled: true,
      priority: 40,
      fieldPolicy: {
        searchable: ['lot_number', 'material_code', 'material_name', 'supplier_lot_number', 'status'],
        excluded: ['tenant_id', 'organization_id', 'material_id', 'location_id', 'qc_inspection_id'],
      },
      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        if (!r.lot_number) return null
        const statusLabel = LOT_STATUS[String(r.status ?? '')] ?? String(r.status ?? '')
        return {
          text: [norm(r.lot_number) ?? '', norm(r.material_code) ?? '', norm(r.material_name) ?? ''].filter(Boolean),
          presenter: {
            title: `${norm(r.lot_number)} — ${norm(r.material_code) ?? ''}`,
            subtitle: `${norm(r.material_name) ?? ''} · ${r.quantity} ${r.uom}`,
            icon: 'package',
            badge: statusLabel,
          },
          links: [{ href: `/backend/mfg-inventory`, label: 'Ver inventario', kind: 'primary' }],
          checksumSource: { lot_number: r.lot_number, status: r.status, quantity: r.quantity, updated_at: r.updated_at },
        }
      },
      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        return {
          title: (norm(r.lot_number) ?? undefined) ?? 'Lote',
          subtitle: (norm(r.material_name) ?? undefined) ?? undefined,
          icon: 'package',
          badge: LOT_STATUS[String(r.status ?? '')] ?? String(r.status ?? ''),
        }
      },
      resolveUrl: async (_ctx: SearchBuildContext): Promise<string | null> => `/backend/mfg-inventory`,
    },
  ],
}
export default searchConfig
export const config = searchConfig
