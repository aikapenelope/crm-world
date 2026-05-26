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

// =========================================================================
// payment_methods.method — Métodos de pago configurados
// Operadores buscan por nombre o código para configurarlos.
// =========================================================================
export const searchConfig: SearchModuleConfig = {
  entities: [{
    entityId: 'payment_methods.payment_method',
    enabled: true,
    priority: 5,
    fieldPolicy: {
      searchable: ['name', 'code', 'currency'],
      excluded: [],
    },
    buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
      const r = ctx.record
      const lines: string[] = []
      if (r.name) lines.push(String(r.name))
      if (r.code) lines.push(String(r.code))
      if (!lines.length) return null
      return {
        text: lines,
        presenter: {
          title: (norm(r.name) ?? undefined) ?? 'Método de pago',
          subtitle: [norm(r.code), norm(r.currency)].filter(Boolean).join(' · ') || undefined,
          icon: 'credit-card',
        },
        links: [{ href: '/backend/payment-methods', label: 'Ver métodos de pago', kind: 'primary' }],
        checksumSource: { name: r.name, code: r.code, is_active: r.is_active },
      }
    },
    formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
      const r = ctx.record
      return {
        title: (norm(r.name) ?? undefined) ?? 'Método de pago',
        subtitle: (norm(r.code) ?? undefined) ?? undefined,
        icon: 'credit-card',
      }
    },
    resolveUrl: async (_ctx: SearchBuildContext): Promise<string | null> => '/backend/payment-methods',
  }],
}

export default searchConfig
export const config = searchConfig
