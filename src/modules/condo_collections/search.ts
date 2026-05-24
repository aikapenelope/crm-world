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

const AGREEMENT_STATUS_LABELS: Record<string, string> = {
  active: 'Activo',
  completed: 'Completado',
  defaulted: 'Incumplido',
  cancelled: 'Cancelado',
}

export const searchConfig: SearchModuleConfig = {
  entities: [
    // =========================================================================
    // condo_collections.agreement — Acuerdos de pago con morosos
    // Los administradores buscan acuerdos por número o estado.
    // =========================================================================
    {
      entityId: 'condo_collections.agreement',
      enabled: true,
      priority: 15,

      fieldPolicy: {
        searchable: ['agreement_number', 'status', 'currency'],
        // Los montos de deuda son financieramente sensibles — excluir de fulltext
        excluded: ['total_debt', 'installment_amount', 'installments'],
      },

      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        const lines: string[] = []

        // Intentar obtener nombre del propietario desde la unidad
        let ownerName: string | null = null
        if (r.unit_id) {
          try {
            const em = (ctx as any).resolve?.('em')
            if (em) {
              const kysely = (em as any).getKysely?.()
              if (kysely) {
                const unit = await kysely
                  .selectFrom('condo_units')
                  .select(['unit_number', 'owner_name'])
                  .where('id', '=', r.unit_id)
                  .executeTakeFirst()
                if (unit) {
                  ownerName = norm(unit.owner_name)
                  if (unit.unit_number) lines.push(`Unidad: ${unit.unit_number}`)
                }
              }
            }
          } catch {
            // Best-effort
          }
        }

        if (ownerName) lines.push(`Propietario: ${ownerName}`)
        if (r.agreement_number) lines.push(`Acuerdo: ${r.agreement_number}`)
        if (r.status) lines.push(`Estado: ${AGREEMENT_STATUS_LABELS[String(r.status)] ?? String(r.status)}`)
        if (!lines.length) return null

        const statusLabel = AGREEMENT_STATUS_LABELS[String(r.status ?? '')] ?? String(r.status ?? '')
        const presenter: SearchResultPresenter = {
          title: (norm(r.agreement_number) as string | undefined) ?? 'Acuerdo de pago',
          subtitle: ownerName ? `${ownerName} · ${statusLabel}` : statusLabel || undefined,
          icon: 'handshake',
          badge: statusLabel,
        }

        return {
          text: lines,
          presenter,
          links: [{ href: '/backend/condo_collections', label: 'Ver cobranzas', kind: 'primary' }],
          checksumSource: {
            agreement_number: r.agreement_number,
            status: r.status,
            paid_installments: r.paid_installments,
            updated_at: r.updated_at,
          },
        }
      },

      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        const statusLabel = AGREEMENT_STATUS_LABELS[String(r.status ?? '')] ?? String(r.status ?? '')
        return {
          title: (norm(r.agreement_number) as string | undefined) ?? 'Acuerdo de pago',
          subtitle: statusLabel || undefined,
          icon: 'handshake',
          badge: statusLabel,
        }
      },

      resolveUrl: async (_ctx: SearchBuildContext): Promise<string | null> => {
        return '/backend/condo_collections'
      },
    },
  ],
}

export default searchConfig
export const config = searchConfig
