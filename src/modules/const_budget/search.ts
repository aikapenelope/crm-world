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

const CATEGORY_LABELS: Record<string, string> = {
  civil: 'Civil', electrical: 'Eléctrico', mechanical: 'Mecánico',
  architectural: 'Arquitectónico', special: 'Especial', general: 'General',
}

// Searches const_budget_items (budget line items and chapters)

export const searchConfig: SearchModuleConfig = {
  entities: [
    {
      entityId: 'const_budget:const_budget_item',
      enabled: true,
      priority: 14,

      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        const lines: string[] = []
        if (r.item_number) lines.push(`Ítem: ${r.item_number}`)
        if (r.name) lines.push(`Descripción: ${r.name}`)
        if (r.category) lines.push(`Categoría: ${CATEGORY_LABELS[String(r.category)] ?? r.category}`)
        if (r.unit) lines.push(`Unidad: ${r.unit}`)
        if (r.total_cost) lines.push(`Total: ${r.currency} ${r.total_cost}`)
        if (r.notes) lines.push(String(r.notes).slice(0, 150))
        if (!lines.length) return null

        const subtitle = [
          norm(r.item_number),
          r.unit ? `${norm(r.quantity)} ${r.unit}` : null,
          r.total_cost ? `${r.currency} ${Number(r.total_cost).toLocaleString('es-VE')}` : null,
        ].filter(Boolean).join(' · ')

        const presenter: SearchResultPresenter = {
          title: String(r.name ?? `Ítem ${r.item_number}`),
          subtitle: subtitle || undefined,
          icon: 'list',
          badge: CATEGORY_LABELS[String(r.category)] ?? norm(r.category) ?? undefined,
        }

        return {
          text: lines,
          presenter,
          links: [{ href: `/backend/const_budget`, label: 'Ver presupuesto', kind: 'primary' }],
          checksumSource: { name: r.name, item_number: r.item_number, total_cost: r.total_cost, updated_at: r.updated_at },
        }
      },

      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        return {
          title: String(r.name ?? `Ítem ${r.item_number}`),
          subtitle: [norm(r.item_number), norm(r.category) ? CATEGORY_LABELS[String(r.category)] : null]
            .filter(Boolean).join(' · ') || undefined,
          icon: 'list',
          badge: CATEGORY_LABELS[String(r.category)] ?? undefined,
        }
      },

      resolveUrl: async (_ctx: SearchBuildContext): Promise<string | null> => {
        return `/backend/const_budget`
      },

      resolveLinks: async (_ctx: SearchBuildContext): Promise<SearchResultLink[] | null> => {
        return [{ href: `/backend/const_budget`, label: 'Ver presupuesto completo', kind: 'secondary' }]
      },

      fieldPolicy: {
        searchable: ['item_number', 'name', 'category', 'unit', 'notes'],
        hashOnly: ['quantity', 'unit_cost', 'total_cost'],
        excluded: [],
      },
    },
  ],
}

export default searchConfig
export const config = searchConfig
