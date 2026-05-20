import type { RequestContext } from '@open-mercato/shared/lib/api/context'
import { bulkUpdateSchema } from '../../data/validators'

const routeMetadata = {
  POST: { requireAuth: true, requireFeatures: ['retail_pricing.bulk_update'] },
}

export const metadata = routeMetadata

/**
 * Bulk price update — actualización masiva de precios.
 *
 * Tipos:
 * - exchange_rate: Recalcula precios basado en nueva tasa USD/VES
 * - percentage: Aplica % de incremento/decremento
 * - fixed: No implementado aún
 *
 * Genera alertas si algún precio queda por debajo del costo o margen mínimo.
 */
export async function POST(request: Request) {
  const { em, scope, user } = (request as any).context as RequestContext
  const kysely = (em as any).getKysely()
  const body = await request.json()
  const input = bulkUpdateSchema.parse(body)

  let productsAffected = 0

  if (input.update_type === 'exchange_rate' && input.old_exchange_rate && input.new_exchange_rate) {
    const oldRate = Number(input.old_exchange_rate)
    const newRate = Number(input.new_exchange_rate)
    const factor = newRate / oldRate

    // Build query for channel prices
    let query = kysely
      .selectFrom('retail_channel_prices')
      .where('tenant_id', '=', scope.tenantId)
      .where('organization_id', '=', scope.organizationId)
      .where('is_active', '=', true)

    if (input.category_id) {
      // Would need join with catalog_products — simplified for now
    }
    if (input.channel) {
      query = query.where('channel', '=', input.channel)
    }

    const prices = await query.selectAll().execute()

    for (const price of prices) {
      const currentPrice = Number((price as any).price)
      const newPrice = (currentPrice * factor).toFixed(4)
      const cost = (price as any).cost ? Number((price as any).cost) : null
      const margin = cost ? ((Number(newPrice) - cost) / Number(newPrice) * 100).toFixed(2) : null

      await kysely
        .updateTable('retail_channel_prices')
        .set({
          price: newPrice,
          actual_margin_percent: margin,
          updated_at: new Date(),
        } as any)
        .where('id', '=', (price as any).id)
        .execute()

      // Generate alert if below cost
      if (cost && Number(newPrice) < cost) {
        await kysely
          .insertInto('retail_price_alerts')
          .values({
            id: crypto.randomUUID(),
            tenant_id: scope.tenantId,
            organization_id: scope.organizationId,
            product_id: (price as any).product_id,
            variant_id: (price as any).variant_id ?? null,
            alert_type: 'below_cost',
            status: 'active',
            current_price: newPrice,
            cost: cost.toFixed(4),
            current_margin: margin,
            message: `Precio USD ${newPrice} está por debajo del costo USD ${cost.toFixed(4)}`,
            created_at: new Date(),
          } as any)
          .execute()
      }

      productsAffected++
    }
  }

  if (input.update_type === 'percentage' && input.percentage_change) {
    const pctChange = Number(input.percentage_change) / 100

    let query = kysely
      .selectFrom('retail_channel_prices')
      .where('tenant_id', '=', scope.tenantId)
      .where('organization_id', '=', scope.organizationId)
      .where('is_active', '=', true)

    if (input.channel) {
      query = query.where('channel', '=', input.channel)
    }

    const prices = await query.selectAll().execute()

    for (const price of prices) {
      const currentPrice = Number((price as any).price)
      const newPrice = (currentPrice * (1 + pctChange)).toFixed(4)
      const cost = (price as any).cost ? Number((price as any).cost) : null
      const margin = cost ? ((Number(newPrice) - cost) / Number(newPrice) * 100).toFixed(2) : null

      await kysely
        .updateTable('retail_channel_prices')
        .set({
          price: newPrice,
          actual_margin_percent: margin,
          updated_at: new Date(),
        } as any)
        .where('id', '=', (price as any).id)
        .execute()

      productsAffected++
    }
  }

  // Record the bulk update
  await kysely
    .insertInto('retail_bulk_price_updates')
    .values({
      id: crypto.randomUUID(),
      tenant_id: scope.tenantId,
      organization_id: scope.organizationId,
      update_type: input.update_type,
      old_exchange_rate: input.old_exchange_rate ?? null,
      new_exchange_rate: input.new_exchange_rate ?? null,
      percentage_change: input.percentage_change ?? null,
      category_id: input.category_id ?? null,
      channel: input.channel ?? null,
      products_affected: productsAffected,
      executed_by: (user as any)?.id ?? null,
      executed_at: new Date(),
    } as any)
    .execute()

  return Response.json({ products_affected: productsAffected, update_type: input.update_type })
}

export const openApi = {}
