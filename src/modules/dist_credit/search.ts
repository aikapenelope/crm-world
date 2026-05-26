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
  active: 'Activo',
  suspended: 'Suspendido',
  blocked: 'Bloqueado',
}

const TYPE_LABELS: Record<string, string> = {
  invoice: 'Factura',
  payment: 'Pago',
  credit_note: 'Nota de crédito',
  adjustment: 'Ajuste',
}

export const searchConfig: SearchModuleConfig = {
  entities: [
    // =========================================================================
    // dist_credit.limit — Límites de crédito por cliente
    // Los vendedores y cobradores buscan cuentas por nombre de cliente o estado.
    // =========================================================================
    {
      entityId: 'dist_credit:dist_credit_limit',
      enabled: true,
      priority: 20,

      fieldPolicy: {
        searchable: ['status', 'currency', 'notes'],
        // Los montos financieros no deben ser buscables en fulltext
        excluded: ['credit_limit', 'current_balance', 'payment_terms_days'],
      },

      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        const lines: string[] = []

        // Intentar cargar el nombre del cliente desde el módulo customers
        let customerName: string | null = null
        if (r.customer_id) {
          try {
            const em = (ctx as any).resolve?.('em')
            if (em) {
              const kysely = (em as any).getKysely?.()
              if (kysely) {
                // customers module stores people in customer_person_profiles
                const person = await kysely
                  .selectFrom('customer_person_profiles')
                  .select(['display_name', 'company_name'])
                  .where('id', '=', r.customer_id)
                  .executeTakeFirst()
                if (person) {
                  customerName = norm(person.company_name) ?? norm(person.display_name)
                }
              }
            }
          } catch {
            // Customer lookup is best-effort
          }
        }

        if (customerName) lines.push(`Cliente: ${customerName}`)
        if (r.status) lines.push(`Estado: ${STATUS_LABELS[String(r.status)] ?? String(r.status)}`)
        if (r.currency) lines.push(`Moneda: ${r.currency}`)
        if (r.notes) lines.push(`Notas: ${r.notes}`)
        if (!lines.length) return null

        const statusLabel = STATUS_LABELS[String(r.status ?? '')] ?? String(r.status ?? '')
        const presenter: SearchResultPresenter = {
          title: customerName ?? 'Límite de crédito',
          subtitle: statusLabel || undefined,
          icon: 'credit-card',
          badge: statusLabel,
        }

        return {
          text: lines,
          presenter,
          links: [{ href: '/backend/dist_credit', label: 'Ver cuentas', kind: 'primary' }],
          checksumSource: {
            customer_id: r.customer_id,
            status: r.status,
            current_balance: r.current_balance,
            updated_at: r.updated_at,
          },
        }
      },

      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        const statusLabel = STATUS_LABELS[String(r.status ?? '')] ?? String(r.status ?? '')
        return {
          title: 'Límite de crédito',
          subtitle: statusLabel || undefined,
          icon: 'credit-card',
          badge: statusLabel,
        }
      },

      resolveUrl: async (_ctx: SearchBuildContext): Promise<string | null> => {
        return '/backend/dist_credit'
      },
    },

    // =========================================================================
    // dist_credit.transaction — Movimientos de cuenta corriente
    // Los cobradores buscan transacciones por descripción o tipo.
    // =========================================================================
    {
      entityId: 'dist_credit:dist_credit_transaction',
      enabled: true,
      priority: 10,

      fieldPolicy: {
        searchable: ['description', 'type', 'reference_type', 'currency'],
        // Los montos son datos financieros sensibles — no exponer en fulltext
        excluded: ['amount', 'balance_after', 'exchange_rate'],
      },

      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        const lines: string[] = []
        if (r.description) lines.push(`Descripción: ${r.description}`)
        if (r.type) lines.push(`Tipo: ${TYPE_LABELS[String(r.type)] ?? String(r.type)}`)
        if (!lines.length) return null

        const typeLabel = TYPE_LABELS[String(r.type ?? '')] ?? String(r.type ?? '')
        return {
          text: lines,
          presenter: {
            title: (norm(r.description) ?? undefined) ?? 'Transacción',
            subtitle: typeLabel || undefined,
            icon: 'arrow-right-left',
            badge: typeLabel,
          },
          links: [{ href: '/backend/dist_credit', label: 'Ver crédito', kind: 'primary' }],
          checksumSource: { description: r.description, type: r.type, updated_at: r.updated_at },
        }
      },

      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        const typeLabel = TYPE_LABELS[String(r.type ?? '')] ?? String(r.type ?? '')
        return {
          title: (norm(r.description) ?? undefined) ?? 'Transacción',
          subtitle: typeLabel || undefined,
          icon: 'arrow-right-left',
        }
      },

      resolveUrl: async (_ctx: SearchBuildContext): Promise<string | null> => {
        return '/backend/dist_credit'
      },
    },
  ],
}

export default searchConfig
export const config = searchConfig
