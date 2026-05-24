import { defineAiTool } from '@open-mercato/ai-assistant'
import { z } from 'zod'

// =============================================================================
// mfg_reports.get_production_summary
// =============================================================================

const getProductionSummary = defineAiTool({
  name: 'mfg_reports.get_production_summary',
  description: 'Get active production orders completion rates and OEE summary for the last 7 days.',
  isMutation: false,
  requiredFeatures: ['mfg_reports.view'],
  inputSchema: z.object({}),
  async handler(_args, ctx) {
    const em = ctx.container.resolve('em')
    const kysely = (em as any).getKysely()
    const since7 = new Date(Date.now() - 7 * 86400000).toISOString()

    const orders = await kysely
      .selectFrom('mfg_production_orders')
      .select(['id', 'order_number', 'product_code', 'planned_quantity', 'actual_quantity', 'status', 'scheduled_end', 'work_center_name'])
      .where('tenant_id', '=', ctx.tenantId)
      .where('status', 'in', ['released', 'in_progress', 'completed'])
      .where('deleted_at', 'is', null)
      .orderBy('scheduled_end', 'asc')
      .limit(15)
      .execute()

    const downtimes = await kysely
      .selectFrom('mfg_production_downtimes')
      .select(['work_center_name', 'duration_hrs', 'is_force_majeure'])
      .where('tenant_id', '=', ctx.tenantId)
      .where('started_at', '>=', since7)
      .where('ended_at', 'is not', null)
      .execute()

    const totalDowntimeHrs       = (downtimes as any[]).reduce((s, d) => s + Number(d.duration_hrs ?? 0), 0)
    const electricalDowntimeHrs  = (downtimes as any[]).filter((d) => d.is_force_majeure).reduce((s, d) => s + Number(d.duration_hrs ?? 0), 0)
    const availableHrs           = 7 * 8 // 7 days × 8h shift (simplified)
    const oeeTotal    = availableHrs > 0 ? ((availableHrs - totalDowntimeHrs) / availableHrs * 100).toFixed(1) : '100'
    const oeeInternal = availableHrs > 0 ? ((availableHrs - (totalDowntimeHrs - electricalDowntimeHrs)) / availableHrs * 100).toFixed(1) : '100'

    const today = new Date().toISOString()
    const lateOrders = (orders as any[]).filter((o) => o.scheduled_end && o.scheduled_end < today && o.status !== 'completed')

    return {
      active_orders: (orders as any[]).length,
      late_orders:   lateOrders.length,
      oee_total_pct:    Number(oeeTotal),
      oee_internal_pct: Number(oeeInternal),
      electrical_downtime_hrs: electricalDowntimeHrs.toFixed(1),
      orders: (orders as any[]).map((o: any) => ({
        order_number:  o.order_number,
        product_code:  o.product_code,
        progress_pct:  Number(o.planned_quantity) > 0 ? (Number(o.actual_quantity ?? 0) / Number(o.planned_quantity) * 100).toFixed(0) : '0',
        status:        o.status,
        is_late:       o.scheduled_end && o.scheduled_end < today && o.status !== 'completed',
        work_center:   o.work_center_name,
      })),
    }
  },
})

// =============================================================================
// mfg_reports.get_quality_status
// =============================================================================

const getQualityStatus = defineAiTool({
  name: 'mfg_reports.get_quality_status',
  description: 'Get open non-conformances by severity and lot rejection rate this month.',
  isMutation: false,
  requiredFeatures: ['mfg_reports.view'],
  inputSchema: z.object({}),
  async handler(_args, ctx) {
    const em = ctx.container.resolve('em')
    const kysely = (em as any).getKysely()
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

    const ncs = await kysely
      .selectFrom('mfg_nonconformances')
      .select(['nc_number', 'severity', 'status', 'source', 'cost_nc_usd', 'product_code', 'created_at'])
      .where('tenant_id', '=', ctx.tenantId)
      .where('status', 'not in', ['closed'])
      .orderBy('created_at', 'desc')
      .limit(20)
      .execute()

    const totalCostNc = (ncs as any[]).reduce((s, n) => s + Number(n.cost_nc_usd ?? 0), 0)
    const bySeverity: Record<string, number> = { critical: 0, major: 0, minor: 0 }
    for (const nc of ncs as any[]) bySeverity[nc.severity] = (bySeverity[nc.severity] ?? 0) + 1

    return {
      open_ncs_total:    (ncs as any[]).length,
      critical_ncs:      bySeverity.critical,
      major_ncs:         bySeverity.major,
      minor_ncs:         bySeverity.minor,
      total_cost_nc_usd: totalCostNc.toFixed(2),
      recent_ncs:        (ncs as any[]).slice(0, 5).map((n: any) => ({ nc_number: n.nc_number, severity: n.severity, source: n.source, product_code: n.product_code })),
    }
  },
})

// =============================================================================
// mfg_reports.get_inventory_alerts
// =============================================================================

const getInventoryAlerts = defineAiTool({
  name: 'mfg_reports.get_inventory_alerts',
  description: 'Get inventory alerts: quarantine lots, expiring within 30 days, materials below reorder point.',
  isMutation: false,
  requiredFeatures: ['mfg_reports.view'],
  inputSchema: z.object({}),
  async handler(_args, ctx) {
    const em = ctx.container.resolve('em')
    const kysely = (em as any).getKysely()
    const in30 = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
    const today = new Date().toISOString().split('T')[0]

    const quarantineLots = await kysely.selectFrom('mfg_stock_lots').select(['material_code', 'material_name', 'quantity', 'uom', 'entry_date']).where('tenant_id', '=', ctx.tenantId).where('status', '=', 'quarantine').limit(10).execute()
    const expiringLots   = await kysely.selectFrom('mfg_stock_lots').select(['material_code', 'quantity', 'uom', 'expiry_date']).where('tenant_id', '=', ctx.tenantId).where('status', '=', 'available').where('expiry_date', '<=', in30).where('expiry_date', '>=', today).orderBy('expiry_date', 'asc').limit(10).execute()

    return {
      quarantine_count:    (quarantineLots as any[]).length,
      expiring_count:      (expiringLots as any[]).length,
      quarantine_lots:     quarantineLots,
      expiring_lots:       expiringLots,
      message: [
        (quarantineLots as any[]).length > 0 && `${(quarantineLots as any[]).length} lote(s) en cuarentena esperando liberación QC`,
        (expiringLots as any[]).length > 0 && `${(expiringLots as any[]).length} lote(s) vencen en ≤ 30 días`,
      ].filter(Boolean).join(' · ') || 'Sin alertas de inventario',
    }
  },
})

// =============================================================================
// mfg_reports.get_maintenance_status
// =============================================================================

const getMaintenanceStatus = defineAiTool({
  name: 'mfg_reports.get_maintenance_status',
  description: 'Get maintenance alerts: overdue plans, breakdown equipment, critical spare parts below minimum.',
  isMutation: false,
  requiredFeatures: ['mfg_reports.view'],
  inputSchema: z.object({}),
  async handler(_args, ctx) {
    const em = ctx.container.resolve('em')
    const kysely = (em as any).getKysely()
    const today = new Date().toISOString().split('T')[0]

    const breakdowns = await kysely.selectFrom('mfg_equipment').select(['equipment_code', 'name', 'criticality']).where('tenant_id', '=', ctx.tenantId).where('status', '=', 'breakdown').where('deleted_at', 'is', null).execute()
    const overdueWos  = await kysely.selectFrom('mfg_work_orders_maint').select(['wo_number', 'equipment_code', 'priority', 'work_type']).where('tenant_id', '=', ctx.tenantId).where('status', 'in', ['open', 'in_progress']).where('scheduled_date', '<', today).limit(10).execute()
    const lowSpares   = await kysely.selectFrom('mfg_spare_parts').select(['part_code', 'part_name', 'current_stock', 'reorder_point', 'is_imported', 'lead_time_days']).where('tenant_id', '=', ctx.tenantId).where('deleted_at', 'is', null).execute()
    const criticalLowSpares = (lowSpares as any[]).filter((p) => Number(p.current_stock) <= Number(p.reorder_point))

    return {
      breakdowns:              (breakdowns as any[]).length,
      overdue_work_orders:     (overdueWos as any[]).length,
      critical_spare_alerts:   criticalLowSpares.length,
      breakdown_equipment:     breakdowns,
      overdue_wos:             overdueWos,
      critical_spares:         criticalLowSpares.slice(0, 5),
    }
  },
})

// =============================================================================
// mfg_reports.get_import_pipeline
// =============================================================================

const getImportPipeline = defineAiTool({
  name: 'mfg_reports.get_import_pipeline',
  description: 'Get active import purchase orders with status and ETA. Flags delayed orders.',
  isMutation: false,
  requiredFeatures: ['mfg_reports.view'],
  inputSchema: z.object({}),
  async handler(_args, ctx) {
    const em = ctx.container.resolve('em')
    const kysely = (em as any).getKysely()
    const today = new Date().toISOString().split('T')[0]

    const activeImports = await kysely
      .selectFrom('mfg_purchase_orders')
      .select(['po_number', 'supplier_name', 'status', 'total_cif_cost', 'estimated_warehouse_arrival', 'actual_warehouse_arrival', 'dau_number'])
      .where('tenant_id', '=', ctx.tenantId)
      .where('po_type', '=', 'international')
      .where('status', 'in', ['in_transit', 'at_customs', 'confirmed'])
      .where('deleted_at', 'is', null)
      .orderBy('estimated_warehouse_arrival', 'asc')
      .limit(10)
      .execute()

    const delayed = (activeImports as any[]).filter((o) => o.estimated_warehouse_arrival && o.estimated_warehouse_arrival < today && !o.actual_warehouse_arrival)

    return {
      active_imports: (activeImports as any[]).length,
      delayed:        delayed.length,
      imports:        (activeImports as any[]).map((o: any) => ({
        po_number:  o.po_number,
        supplier:   o.supplier_name,
        status:     o.status,
        cif_usd:    o.total_cif_cost,
        eta:        o.estimated_warehouse_arrival,
        is_delayed: o.estimated_warehouse_arrival && o.estimated_warehouse_arrival < today && !o.actual_warehouse_arrival,
        dau:        o.dau_number,
      })),
    }
  },
})

// =============================================================================
// mfg_reports.get_cost_performance
// =============================================================================

const getCostPerformance = defineAiTool({
  name: 'mfg_reports.get_cost_performance',
  description: 'Get cost variance summary from recently completed production orders: favorable vs unfavorable.',
  isMutation: false,
  requiredFeatures: ['mfg_reports.view'],
  inputSchema: z.object({ days: z.number().int().min(1).max(90).default(30) }),
  async handler(args, ctx) {
    const em = ctx.container.resolve('em')
    const kysely = (em as any).getKysely()
    const since = new Date(Date.now() - args.days * 86400000).toISOString()

    const variances = await kysely
      .selectFrom('mfg_cost_variances')
      .select(['order_number', 'product_code', 'standard_cost_usd', 'actual_cost_usd', 'total_variance_usd', 'price_variance_usd', 'quantity_variance_usd', 'labor_variance_usd', 'status', 'bcv_rate_used'])
      .where('tenant_id', '=', ctx.tenantId)
      .where('calculated_at', '>=', since)
      .orderBy('calculated_at', 'desc')
      .limit(20)
      .execute()

    const totalVariance  = (variances as any[]).reduce((s, v) => s + Number(v.total_variance_usd), 0)
    const unfavorable    = (variances as any[]).filter((v) => Number(v.total_variance_usd) > 0)
    const favorable      = (variances as any[]).filter((v) => Number(v.total_variance_usd) <= 0)

    return {
      period_days:        args.days,
      orders_analyzed:    (variances as any[]).length,
      total_variance_usd: totalVariance.toFixed(2),
      unfavorable_count:  unfavorable.length,
      favorable_count:    favorable.length,
      worst_variances:    unfavorable.slice(0, 3).map((v: any) => ({
        order_number:  v.order_number,
        product_code:  v.product_code,
        variance_usd:  Number(v.total_variance_usd).toFixed(2),
        price_var:     Number(v.price_variance_usd).toFixed(2),
        qty_var:       Number(v.quantity_variance_usd).toFixed(2),
        labor_var:     Number(v.labor_variance_usd).toFixed(2),
      })),
      message: totalVariance > 0
        ? `⚠ USD ${totalVariance.toFixed(2)} desfavorable en el período`
        : `✅ USD ${Math.abs(totalVariance).toFixed(2)} favorable en el período`,
    }
  },
})

// Export
export const aiTools = [
  getProductionSummary, getQualityStatus, getInventoryAlerts,
  getMaintenanceStatus, getImportPipeline, getCostPerformance,
]
export default aiTools
