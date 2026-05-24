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
  received: 'Recibido',
  diagnosis: 'En diagnóstico',
  estimate_sent: 'Presupuesto enviado',
  approved: 'Aprobado',
  in_repair: 'En reparación',
  quality_check: 'Control de calidad',
  ready: 'Listo',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
}

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Baja',
  normal: 'Normal',
  high: 'Alta',
  urgent: 'Urgente',
}

export const searchConfig: SearchModuleConfig = {
  entities: [
    {
      entityId: 'auto_service_orders.order',
      enabled: true,
      priority: 25,

      fieldPolicy: {
        // order_number, status, priority son los campos más buscados
        searchable: ['order_number', 'status', 'priority', 'customer_complaint', 'diagnosis_notes'],
        // customer_complaint y diagnosis_notes son texto libre — no contienen PII,
        // pero pueden ser largos. Los incluimos como searchable con el fallback de tokens.
        excluded: ['total_labor', 'total_parts', 'total_amount', 'currency'],
      },

      buildSource: async (ctx: SearchBuildContext): Promise<SearchIndexSource | null> => {
        const r = ctx.record
        const lines: string[] = []
        if (r.order_number) lines.push(`Orden: ${r.order_number}`)
        if (r.status) lines.push(`Estado: ${STATUS_LABELS[String(r.status)] ?? String(r.status)}`)
        if (r.priority) lines.push(`Prioridad: ${PRIORITY_LABELS[String(r.priority)] ?? String(r.priority)}`)
        if (r.customer_complaint) lines.push(`Reporte cliente: ${r.customer_complaint}`)
        if (r.diagnosis_notes) lines.push(`Diagnóstico: ${r.diagnosis_notes}`)

        // Cargar placa y datos del vehículo para enriquecer la búsqueda
        let vehicleLabel: string | null = null
        if (r.vehicle_id && ctx.record) {
          try {
            const em = (ctx as any).resolve?.('em')
            if (em) {
              const kysely = (em as any).getKysely?.()
              if (kysely) {
                const vehicle = await kysely
                  .selectFrom('auto_vehicles')
                  .select(['plate', 'brand', 'model', 'year'])
                  .where('id', '=', r.vehicle_id)
                  .executeTakeFirst()
                if (vehicle) {
                  vehicleLabel = [vehicle.brand, vehicle.model, vehicle.year].filter(Boolean).join(' ')
                  if (vehicle.plate) {
                    lines.push(`Placa: ${vehicle.plate}`)
                    lines.push(`Vehículo: ${vehicleLabel}`)
                  }
                }
              }
            }
          } catch {
            // Vehicle lookup is best-effort — don't fail indexing
          }
        }

        if (!lines.length) return null

        const statusLabel = STATUS_LABELS[String(r.status ?? '')] ?? String(r.status ?? '')
        const presenter: SearchResultPresenter = {
          title: (norm(r.order_number) as string | undefined) ?? 'Orden de servicio',
          subtitle: vehicleLabel ? `${vehicleLabel} · ${statusLabel}` : statusLabel || undefined,
          icon: 'wrench',
          badge: statusLabel,
        }

        return {
          text: lines,
          presenter,
          links: [{ href: '/backend/auto_service_orders', label: 'Ver órdenes', kind: 'primary' }],
          checksumSource: {
            order_number: r.order_number,
            status: r.status,
            priority: r.priority,
            vehicle_id: r.vehicle_id,
            updated_at: r.updated_at,
          },
        }
      },

      formatResult: async (ctx: SearchBuildContext): Promise<SearchResultPresenter | null> => {
        const r = ctx.record
        const statusLabel = STATUS_LABELS[String(r.status ?? '')] ?? String(r.status ?? '')
        return {
          title: (norm(r.order_number) as string | undefined) ?? 'Orden de servicio',
          subtitle: statusLabel || undefined,
          icon: 'wrench',
          badge: statusLabel,
        }
      },

      resolveUrl: async (_ctx: SearchBuildContext): Promise<string | null> => {
        return '/backend/auto_service_orders'
      },
    },
  ],
}

export default searchConfig
export const config = searchConfig
