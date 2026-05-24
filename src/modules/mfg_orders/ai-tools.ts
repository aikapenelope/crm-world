import { defineAiTool } from '@open-mercato/ai-assistant'
import { z } from 'zod'

// =============================================================================
// mfg.get_active_orders_status
// Órdenes activas con progreso y estado de cumplimiento
// =============================================================================

const getActiveOrdersStatus = defineAiTool({
  name: 'mfg.get_active_orders_status',
  description: 'Get all active production orders with progress percentage and on-time delivery status.',
  isMutation: false,
  requiredFeatures: ['mfg_orders.view'],
  inputSchema: z.object({
    work_center_id: z.string().uuid().optional().describe('Filter by work center / production line'),
    product_code:   z.string().optional().describe('Filter by product code'),
  }),
  async handler(args: any, ctx: any) {
    const em     = ctx.container.resolve('em')
    const kysely = (em as any).getKysely()
    const today  = new Date().toISOString()

    let query = kysely
      .selectFrom('mfg_production_orders')
      .selectAll()
      .where('tenant_id', '=', ctx.tenantId)
      .where('organization_id', '=', ctx.organizationId)
      .where('status', 'in', ['released', 'in_progress'])
      .where('deleted_at', 'is', null)

    if (args.work_center_id) query = query.where('work_center_id', '=', args.work_center_id)
    if (args.product_code) query = query.where('product_code', 'like', `%${args.product_code}%`)

    const orders = await query.orderBy('scheduled_end', 'asc').limit(20).execute()

    const result = (orders as any[]).map((o: any) => {
      const plannedQty   = Number(o.planned_quantity)
      const actualQty    = Number(o.actual_quantity ?? 0)
      const progressPct  = plannedQty > 0 ? Math.min(100, (actualQty / plannedQty) * 100).toFixed(1) : '0'
      const isLate       = o.scheduled_end && o.scheduled_end < today && o.status !== 'completed'
      const daysRemaining = o.scheduled_end
        ? Math.ceil((new Date(o.scheduled_end).getTime() - Date.now()) / 86400000)
        : null
      return {
        order_number:    o.order_number,
        product_code:    o.product_code,
        product_name:    o.product_name,
        status:          o.status,
        planned_qty:     o.planned_quantity,
        actual_qty:      o.actual_quantity ?? '0',
        uom:             o.uom,
        progress_pct:    progressPct,
        scheduled_end:   o.scheduled_end,
        days_remaining:  daysRemaining,
        is_late:         isLate,
        work_center:     o.work_center_name,
      }
    })

    const lateCount = result.filter((o) => o.is_late).length
    return {
      orders: result,
      total:  result.length,
      late:   lateCount,
      message: lateCount > 0
        ? `⚠ ${lateCount} orden(es) con retraso respecto a fecha planificada`
        : `${result.length} orden(es) activa(s) en producción`,
    }
  },
})

// =============================================================================
// mfg.get_oee_by_line
// OEE por centro de trabajo, con y sin paros por corte eléctrico
// =============================================================================

const getOeeByLine = defineAiTool({
  name: 'mfg.get_oee_by_line',
  description: 'Get OEE per work center for the last 30 days. Returns total OEE and internal OEE (excluding electrical outages — CORPOELEC force majeure).',
  isMutation: false,
  requiredFeatures: ['mfg_orders.view'],
  inputSchema: z.object({
    days: z.number().int().min(1).max(90).default(30).describe('Number of days to analyze'),
  }),
  async handler(args: any, ctx: any) {
    const em     = ctx.container.resolve('em')
    const kysely = (em as any).getKysely()
    const since  = new Date(Date.now() - args.days * 86400000).toISOString()

    const workCenters = await kysely
      .selectFrom('mfg_work_centers')
      .select(['id', 'code', 'name', 'capacity_hrs_per_shift', 'efficiency_pct'])
      .where('tenant_id', '=', ctx.tenantId)
      .where('organization_id', '=', ctx.organizationId)
      .where('is_active', '=', true)
      .where('deleted_at', 'is', null)
      .execute()

    const result = await Promise.all((workCenters as any[]).map(async (wc: any) => {
      const downtimes = await kysely
        .selectFrom('mfg_production_downtimes')
        .select(['duration_hrs', 'is_force_majeure', 'cause_category'])
        .where('tenant_id', '=', ctx.tenantId)
        .where('work_center_id', '=', wc.id)
        .where('started_at', '>=', since)
        .where('ended_at', 'is not', null)
        .execute()

      const totalDowntimeHrs       = (downtimes as any[]).reduce((s, d) => s + Number(d.duration_hrs ?? 0), 0)
      const electricalDowntimeHrs  = (downtimes as any[]).filter((d) => d.is_force_majeure).reduce((s, d) => s + Number(d.duration_hrs ?? 0), 0)
      const internalDowntimeHrs    = totalDowntimeHrs - electricalDowntimeHrs

      // Planned production time = capacity × days analyzed (simplified)
      const plannedHrs = Number(wc.capacity_hrs_per_shift) * args.days

      const availabilityTotal    = plannedHrs > 0 ? ((plannedHrs - totalDowntimeHrs) / plannedHrs) * 100 : 100
      const availabilityInternal = plannedHrs > 0 ? ((plannedHrs - internalDowntimeHrs) / plannedHrs) * 100 : 100

      // Performance and Quality assumed 100% here (simplified — real calculation needs production data)
      const oeeTotal    = Math.max(0, availabilityTotal).toFixed(1)
      const oeeInternal = Math.max(0, availabilityInternal).toFixed(1)

      return {
        work_center:              wc.name,
        code:                     wc.code,
        total_downtime_hrs:       Number(totalDowntimeHrs.toFixed(2)),
        electrical_downtime_hrs:  Number(electricalDowntimeHrs.toFixed(2)),
        internal_downtime_hrs:    Number(internalDowntimeHrs.toFixed(2)),
        oee_total_pct:            Number(oeeTotal),
        oee_internal_pct:         Number(oeeInternal),
        interpretation:           Number(oeeInternal) >= 85 ? 'Excelente' : Number(oeeInternal) >= 65 ? 'Aceptable' : 'Requiere atención',
      }
    }))

    return {
      period_days: args.days,
      lines:       result,
      note:        'OEE total incluye cortes CORPOELEC. OEE interno excluye fuerza mayor para medir eficiencia real del equipo.',
    }
  },
})

// =============================================================================
// mfg.get_downtime_analysis
// Análisis de paros por categoría en los últimos 30 días
// =============================================================================

const getDowntimeAnalysis = defineAiTool({
  name: 'mfg.get_downtime_analysis',
  description: 'Get downtime analysis by cause category for the last N days. Highlights electrical outages separately.',
  isMutation: false,
  requiredFeatures: ['mfg_orders.view'],
  inputSchema: z.object({
    days: z.number().int().min(1).max(90).default(30),
  }),
  async handler(args: any, ctx: any) {
    const em     = ctx.container.resolve('em')
    const kysely = (em as any).getKysely()
    const since  = new Date(Date.now() - args.days * 86400000).toISOString()

    const downtimes = await kysely
      .selectFrom('mfg_production_downtimes')
      .select(['cause_category', 'duration_hrs', 'is_force_majeure', 'work_center_name'])
      .where('tenant_id', '=', ctx.tenantId)
      .where('organization_id', '=', ctx.organizationId)
      .where('started_at', '>=', since)
      .where('ended_at', 'is not', null)
      .execute()

    const byCategory: Record<string, { hours: number; count: number; is_force_majeure: boolean }> = {}
    for (const d of downtimes as any[]) {
      const cat = d.cause_category as string
      if (!byCategory[cat]) byCategory[cat] = { hours: 0, count: 0, is_force_majeure: Boolean(d.is_force_majeure) }
      byCategory[cat].hours += Number(d.duration_hrs ?? 0)
      byCategory[cat].count += 1
    }

    const totalHrs      = Object.values(byCategory).reduce((s, v) => s + v.hours, 0)
    const electricalHrs = byCategory['electrical_cut']?.hours ?? 0

    const summary = Object.entries(byCategory)
      .map(([cat, v]) => ({
        cause:          cat,
        hours:          Number(v.hours.toFixed(2)),
        incidents:      v.count,
        pct_of_total:   totalHrs > 0 ? Number(((v.hours / totalHrs) * 100).toFixed(1)) : 0,
        is_force_majeure: v.is_force_majeure,
      }))
      .sort((a, b) => b.hours - a.hours)

    return {
      period_days:        args.days,
      total_downtime_hrs: Number(totalHrs.toFixed(2)),
      electrical_hrs:     Number(electricalHrs.toFixed(2)),
      internal_hrs:       Number((totalHrs - electricalHrs).toFixed(2)),
      by_category:        summary,
      message:            electricalHrs > 0
        ? `⚡ ${electricalHrs.toFixed(1)}h de paros por CORPOELEC (${((electricalHrs / totalHrs) * 100).toFixed(0)}% del total)`
        : 'Sin paros por corte eléctrico en el período',
    }
  },
})

// =============================================================================
// mfg.get_material_shortage_alerts
// Materiales en cuarentena o bajo el punto de reorden que bloquean producción
// =============================================================================

const getMaterialShortageAlerts = defineAiTool({
  name: 'mfg.get_material_shortage_alerts',
  description: 'Get materials that are in quarantine or have insufficient stock for active production orders.',
  isMutation: false,
  requiredFeatures: ['mfg_orders.view'],
  inputSchema: z.object({}),
  async handler(_args: any, ctx: any) {
    const em     = ctx.container.resolve('em')
    const kysely = (em as any).getKysely()

    const quarantineLots = await kysely
      .selectFrom('mfg_stock_lots')
      .select(['material_code', 'material_name', 'lot_number', 'quantity', 'uom', 'entry_date'])
      .where('tenant_id', '=', ctx.tenantId)
      .where('organization_id', '=', ctx.organizationId)
      .where('status', '=', 'quarantine')
      .orderBy('entry_date', 'asc')
      .limit(20)
      .execute()

    const expiringSoon = await kysely
      .selectFrom('mfg_stock_lots')
      .select(['material_code', 'material_name', 'lot_number', 'quantity', 'uom', 'expiry_date'])
      .where('tenant_id', '=', ctx.tenantId)
      .where('organization_id', '=', ctx.organizationId)
      .where('status', '=', 'available')
      .where('expiry_date', '<=', new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0])
      .where('expiry_date', 'is not', null)
      .orderBy('expiry_date', 'asc')
      .limit(10)
      .execute()

    return {
      quarantine_lots:    quarantineLots,
      quarantine_count:   (quarantineLots as any[]).length,
      expiring_soon:      expiringSoon,
      expiring_count:     (expiringSoon as any[]).length,
      message:            [
        (quarantineLots as any[]).length > 0 && `${(quarantineLots as any[]).length} lote(s) en cuarentena esperando liberación QC`,
        (expiringSoon as any[]).length > 0 && `${(expiringSoon as any[]).length} lote(s) vencen en ≤ 30 días`,
      ].filter(Boolean).join(' · ') || 'Sin alertas de materiales',
    }
  },
})

// =============================================================================
// mfg.get_cost_variance_summary
// Variaciones de costo en órdenes cerradas recientemente
// =============================================================================

const getCostVarianceSummary = defineAiTool({
  name: 'mfg.get_cost_variance_summary',
  description: 'Get cost variance summary from recently completed production orders: planned vs actual cost.',
  isMutation: false,
  requiredFeatures: ['mfg_orders.view'],
  inputSchema: z.object({
    days: z.number().int().min(1).max(90).default(30),
  }),
  async handler(args: any, ctx: any) {
    const em     = ctx.container.resolve('em')
    const kysely = (em as any).getKysely()
    const since  = new Date(Date.now() - args.days * 86400000).toISOString()

    const orders = await kysely
      .selectFrom('mfg_production_orders')
      .select(['order_number', 'product_code', 'product_name', 'planned_quantity', 'actual_quantity', 'uom', 'planned_cost_usd', 'actual_cost_usd', 'actual_end'])
      .where('tenant_id', '=', ctx.tenantId)
      .where('organization_id', '=', ctx.organizationId)
      .where('status', '=', 'completed')
      .where('actual_end', '>=', since)
      .where('planned_cost_usd', 'is not', null)
      .where('actual_cost_usd', 'is not', null)
      .orderBy('actual_end', 'desc')
      .limit(20)
      .execute()

    const result = (orders as any[]).map((o: any) => {
      const planned  = Number(o.planned_cost_usd)
      const actual   = Number(o.actual_cost_usd)
      const variance = actual - planned
      const variancePct = planned > 0 ? ((variance / planned) * 100).toFixed(1) : '0'
      return {
        order_number:     o.order_number,
        product_code:     o.product_code,
        planned_cost_usd: Number(planned.toFixed(2)),
        actual_cost_usd:  Number(actual.toFixed(2)),
        variance_usd:     Number(variance.toFixed(2)),
        variance_pct:     Number(variancePct),
        favorable:        variance <= 0,
        completed_at:     o.actual_end,
      }
    })

    const unfavorable = result.filter((o) => !o.favorable)
    const totalVariance = result.reduce((s, o) => s + o.variance_usd, 0)

    return {
      period_days:       args.days,
      orders:            result,
      total:             result.length,
      unfavorable_count: unfavorable.length,
      total_variance_usd: Number(totalVariance.toFixed(2)),
      message:            totalVariance > 0
        ? `⚠ USD ${totalVariance.toFixed(2)} por encima del costo estándar en el período`
        : `Costo por debajo del estándar en USD ${Math.abs(totalVariance).toFixed(2)} — favorable`,
    }
  },
})

// =============================================================================
// mfg.get_production_schedule
// Próximas órdenes y carga de capacidad por línea
// =============================================================================

const getProductionSchedule = defineAiTool({
  name: 'mfg.get_production_schedule',
  description: 'Get production schedule for the next 7 days with capacity load per work center.',
  isMutation: false,
  requiredFeatures: ['mfg_orders.view'],
  inputSchema: z.object({
    days: z.number().int().min(1).max(30).default(7),
  }),
  async handler(args: any, ctx: any) {
    const em     = ctx.container.resolve('em')
    const kysely = (em as any).getKysely()
    const until  = new Date(Date.now() + args.days * 86400000).toISOString()
    const now    = new Date().toISOString()

    const upcoming = await kysely
      .selectFrom('mfg_production_orders')
      .select(['order_number', 'product_code', 'product_name', 'planned_quantity', 'uom', 'scheduled_start', 'scheduled_end', 'work_center_name', 'status'])
      .where('tenant_id', '=', ctx.tenantId)
      .where('organization_id', '=', ctx.organizationId)
      .where('status', 'in', ['planned', 'released', 'in_progress'])
      .where('scheduled_start', '<=', until)
      .where('deleted_at', 'is', null)
      .orderBy('scheduled_start', 'asc')
      .limit(20)
      .execute()

    return {
      period_days: args.days,
      orders:      upcoming,
      total:       (upcoming as any[]).length,
      message:     `${(upcoming as any[]).length} orden(es) programadas en los próximos ${args.days} días`,
    }
  },
})

// =============================================================================
// Export
// =============================================================================

export const aiTools = [
  getActiveOrdersStatus,
  getOeeByLine,
  getDowntimeAnalysis,
  getMaterialShortageAlerts,
  getCostVarianceSummary,
  getProductionSchedule,
]

export default aiTools
