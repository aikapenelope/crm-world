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

const TYPE_LABEL: Record<string, string> = {
  medication: 'Medicamento', vaccine: 'Vacuna', feed: 'Alimento',
  agrochemical: 'Agroquímico', material: 'Material',
}

export const searchConfig: SearchModuleConfig = {
  entities: [
    {
      entityId: 'agri_inputs.item',
      enabled: true,
      priority: 30,

      fieldPolicy: {
        searchable: ['name', 'input_type', 'category', 'active_ingredient', 'manufacturer', 'insai_registry', 'lot_number'],
        excluded: ['tenant_id', 'organization_id', 'storage_temp_min', 'storage_temp_max'],
      },

      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        if (!r.name) return null
        const typeLabel = TYPE_LABEL[String(r.input_type ?? '')] ?? String(r.input_type ?? '')
        const isLow = Number(r.quantity_available) <= Number(r.min_stock)
        const isExpiring = r.expiry_date != null && new Date(r.expiry_date as string) <= new Date(Date.now() + 30 * 86400000)
        const badge = isExpiring ? 'Por vencer' : isLow ? 'Stock bajo' : r.is_active ? 'Activo' : 'Inactivo'
        return {
          text: [
            norm(r.name) ?? '',
            norm(r.active_ingredient) ?? '',
            norm(r.insai_registry) ?? '',
            norm(r.lot_number) ?? '',
          ].filter(Boolean),
          presenter: {
            title: (norm(r.name) as string | undefined) ?? 'Insumo',
            subtitle: [typeLabel, norm(r.category)].filter(Boolean).join(' · ') || undefined,
            icon: r.input_type === 'vaccine' ? 'syringe' : r.input_type === 'medication' ? 'pill' : 'package',
            badge,
          },
          links: [{ href: `/backend/agri-inputs/${r.id}`, label: 'Ver insumo', kind: 'primary' }],
          checksumSource: { name: r.name, quantity_available: r.quantity_available, expiry_date: r.expiry_date, updated_at: r.updated_at },
        }
      },

      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        const typeLabel = TYPE_LABEL[String(r.input_type ?? '')] ?? String(r.input_type ?? '')
        return {
          title: (norm(r.name) as string | undefined) ?? 'Insumo',
          subtitle: typeLabel,
          icon: r.input_type === 'vaccine' ? 'syringe' : 'pill',
          badge: r.is_active ? 'Activo' : 'Inactivo',
        }
      },

      resolveUrl: async (ctx: SearchBuildContext): Promise<string | null> =>
        `/backend/agri-inputs/${ctx.record.id}`,
    },
  ],
}

export default searchConfig
export const config = searchConfig
