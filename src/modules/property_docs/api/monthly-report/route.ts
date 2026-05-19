/**
 * Monthly Report API endpoint.
 * Returns aggregated data for a given month: transactions, pipeline, inventory.
 * Can be used to generate PDF reports or display in dashboard.
 */
import { z } from 'zod'
import type { EntityManager } from '@mikro-orm/core'

const paramsSchema = z.object({
  year: z.coerce.number().min(2020).max(2100),
  month: z.coerce.number().min(1).max(12),
})

export const metadata = {
  GET: { requireAuth: true, requireFeatures: ['transactions.view', 'properties.view'] },
}

export async function GET(request: Request, ctx: any) {
  const url = new URL(request.url)
  const parsed = paramsSchema.safeParse({
    year: url.searchParams.get('year'),
    month: url.searchParams.get('month'),
  })

  if (!parsed.success) {
    return Response.json({ error: 'year and month required (e.g. ?year=2026&month=5)' }, { status: 400 })
  }

  const { year, month } = parsed.data
  const scope = ctx.scope
  const em: EntityManager = ctx.container.resolve('em')
  const kysely = (em as any).getKysely()

  // Date range for the month
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 1)

  // Transactions in this month
  const transactions = await kysely
    .selectFrom('property_transactions')
    .selectAll()
    .where('tenant_id', '=', scope.tenantId)
    .where('created_at', '>=', startDate.toISOString())
    .where('created_at', '<', endDate.toISOString())
    .where('deleted_at', 'is', null)
    .orderBy('created_at', 'desc')
    .execute()

  const completedTx = transactions.filter((t: any) => t.status === 'completed')
  const pendingTx = transactions.filter((t: any) => t.status === 'pending')

  const totalSalesVolume = completedTx
    .filter((t: any) => t.transaction_type === 'sale')
    .reduce((sum: number, t: any) => sum + parseFloat(t.sale_price || '0'), 0)

  const totalCommissions = completedTx
    .reduce((sum: number, t: any) => sum + parseFloat(t.commission_amount || '0'), 0)

  // Current inventory snapshot
  const properties = await kysely
    .selectFrom('properties')
    .select(['id', 'status', 'operation', 'price', 'currency'])
    .where('tenant_id', '=', scope.tenantId)
    .where('deleted_at', 'is', null)
    .execute()

  const inventory = {
    total: properties.length,
    active: properties.filter((p: any) => p.status === 'active').length,
    reserved: properties.filter((p: any) => p.status === 'reserved').length,
    sold: properties.filter((p: any) => p.status === 'sold').length,
    rented: properties.filter((p: any) => p.status === 'rented').length,
    inactive: properties.filter((p: any) => p.status === 'inactive').length,
    draft: properties.filter((p: any) => p.status === 'draft').length,
  }

  const activeValue = properties
    .filter((p: any) => p.status === 'active' || p.status === 'reserved')
    .reduce((sum: number, p: any) => sum + parseFloat(p.price || '0'), 0)

  return Response.json({
    period: { year, month, label: `${year}-${String(month).padStart(2, '0')}` },
    transactions: {
      total: transactions.length,
      completed: completedTx.length,
      pending: pendingTx.length,
      total_sales_volume: Math.round(totalSalesVolume * 100) / 100,
      total_commissions: Math.round(totalCommissions * 100) / 100,
    },
    inventory,
    pipeline_value: Math.round(activeValue * 100) / 100,
  })
}

export const openApi = {}
