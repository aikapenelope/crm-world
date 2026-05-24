/**
 * GET /api/mfg-reports/kpi-summary
 * Returns aggregated KPIs from all mfg_ modules for the dashboard.
 */
export const metadata = { GET: { requireAuth: true, requireFeatures: ['mfg_reports.view'] } }

export async function GET(request: Request, ctx: any) {
  const em     = ctx.container.resolve('em')
  const scope  = ctx.scope
  const kysely = (em as any).getKysely()

  const today  = new Date().toISOString().split('T')[0]
  const in7    = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  const in30   = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  const since7 = new Date(Date.now() - 7 * 86400000).toISOString()
  const since30 = new Date(Date.now() - 30 * 86400000).toISOString()

  const [
    activeOrders, openNcs, quarantineLots, expiringLots, breakdowns, openWos, lowSpares, activeImports, recentVariances, activeSCs,
  ] = await Promise.allSettled([
    kysely.selectFrom('mfg_production_orders').select([kysely.fn.count('id').as('count')]).where('tenant_id', '=', scope.tenantId).where('status', 'in', ['released', 'in_progress']).where('deleted_at', 'is', null).executeTakeFirst(),
    kysely.selectFrom('mfg_nonconformances').select([kysely.fn.count('id').as('count'), kysely.fn.count(kysely.case().when('severity', '=', 'critical').then('1').else(null).end()).as('critical_count')]).where('tenant_id', '=', scope.tenantId).where('status', 'not in', ['closed']).executeTakeFirst(),
    kysely.selectFrom('mfg_stock_lots').select([kysely.fn.count('id').as('count')]).where('tenant_id', '=', scope.tenantId).where('status', '=', 'quarantine').executeTakeFirst(),
    kysely.selectFrom('mfg_stock_lots').select([kysely.fn.count('id').as('count')]).where('tenant_id', '=', scope.tenantId).where('status', '=', 'available').where('expiry_date', '<=', in30).where('expiry_date', '>=', today).executeTakeFirst(),
    kysely.selectFrom('mfg_equipment').select([kysely.fn.count('id').as('count')]).where('tenant_id', '=', scope.tenantId).where('status', '=', 'breakdown').where('deleted_at', 'is', null).executeTakeFirst(),
    kysely.selectFrom('mfg_work_orders_maint').select([kysely.fn.count('id').as('count')]).where('tenant_id', '=', scope.tenantId).where('status', 'in', ['open', 'in_progress']).executeTakeFirst(),
    kysely.selectFrom('mfg_spare_parts').select([kysely.fn.count('id').as('count')]).where('tenant_id', '=', scope.tenantId).where('deleted_at', 'is', null).execute(),
    kysely.selectFrom('mfg_purchase_orders').select([kysely.fn.count('id').as('count')]).where('tenant_id', '=', scope.tenantId).where('po_type', '=', 'international').where('status', 'in', ['in_transit', 'at_customs']).where('deleted_at', 'is', null).executeTakeFirst(),
    kysely.selectFrom('mfg_cost_variances').select([kysely.fn.sum('total_variance_usd').as('total')]).where('tenant_id', '=', scope.tenantId).where('calculated_at', '>=', since30).executeTakeFirst(),
    kysely.selectFrom('mfg_subcontract_orders').select([kysely.fn.count('id').as('count')]).where('tenant_id', '=', scope.tenantId).where('status', 'in', ['materials_sent', 'in_production']).where('deleted_at', 'is', null).executeTakeFirst(),
  ])

  // Count spare parts below reorder
  let spareAlertsCount = 0
  if (lowSpares.status === 'fulfilled') {
    try {
      const allSpares = await kysely.selectFrom('mfg_spare_parts').select(['current_stock', 'reorder_point']).where('tenant_id', '=', scope.tenantId).where('deleted_at', 'is', null).execute()
      spareAlertsCount = (allSpares as any[]).filter((p) => Number(p.current_stock) <= Number(p.reorder_point)).length
    } catch { /* cross-module may not be initialized */ }
  }

  const value = <T>(r: PromiseSettledResult<T>, key: string): number => {
    if (r.status === 'fulfilled' && r.value) return Number((r.value as any)[key] ?? 0)
    return 0
  }

  return Response.json({
    data: {
      production: {
        active_orders:    value(activeOrders, 'count'),
      },
      quality: {
        open_ncs:         value(openNcs, 'count'),
        critical_ncs:     value(openNcs, 'critical_count'),
      },
      inventory: {
        quarantine_lots:  value(quarantineLots, 'count'),
        expiring_lots:    value(expiringLots, 'count'),
      },
      maintenance: {
        breakdowns:       value(breakdowns, 'count'),
        open_wos:         value(openWos, 'count'),
        spare_alerts:     spareAlertsCount,
      },
      procurement: {
        active_imports:   value(activeImports, 'count'),
      },
      costs: {
        total_variance_30d: Number((recentVariances.status === 'fulfilled' ? (recentVariances.value as any)?.total : 0) ?? 0).toFixed(2),
      },
      subcontracting: {
        active_scs:       value(activeSCs, 'count'),
      },
    },
  })
}

export const openApi = {}
