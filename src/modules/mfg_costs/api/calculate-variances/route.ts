/**
 * POST /api/mfg-costs/calculate-variances?order_id=<uuid>
 *
 * Calcula las 3 variaciones de costo al cierre de una orden de producción:
 *   1. Variación de precio   — ¿pagué la MP más cara que el estándar?
 *   2. Variación de cantidad — ¿consumí más MP que el BOM especifica?
 *   3. Variación de MO       — ¿tardé más del tiempo estándar?
 *
 * Crea o actualiza el registro MfgCostVariance para la orden.
 * También actualiza actual_cost_usd en la orden de producción.
 *
 * Bimoneda venezolana: intenta leer el tipo BCV del módulo venezuela_rates.
 * Si no está disponible, usa el último tipo registrado en standard_costs.
 */
import { emitLifecycle } from '@/lib/emit-lifecycle'
import { eventsConfig } from '../../../events'
import { v4 } from 'uuid'

export const metadata = {
  GET:  { requireAuth: true, requireFeatures: ['mfg_costs.view'] },
  POST: { requireAuth: true, requireFeatures: ['mfg_costs.approve'] },
}

export async function POST(request: Request, ctx: any) {
  const em     = ctx.container.resolve('em')
  const scope  = ctx.scope
  const kysely = (em as any).getKysely()

  const url     = new URL(request.url)
  const orderId = url.searchParams.get('order_id')
  if (!orderId) return Response.json({ error: 'order_id required' }, { status: 400 })

  // Load production order
  const order = await kysely
    .selectFrom('mfg_production_orders')
    .selectAll()
    .where('id', '=', orderId)
    .where('tenant_id', '=', scope.tenantId)
    .where('deleted_at', 'is', null)
    .executeTakeFirst()

  if (!order) return Response.json({ error: 'Order not found' }, { status: 404 })
  if ((order as any).status !== 'completed') return Response.json({ error: 'Order must be completed before calculating variances' }, { status: 400 })

  const o           = order as any
  const actualQty   = Number(o.actual_quantity ?? o.planned_quantity)
  const plannedQty  = Number(o.planned_quantity)

  // Load standard cost for the product
  const stdCost = await kysely
    .selectFrom('mfg_standard_costs')
    .selectAll()
    .where('product_id', '=', o.product_id)
    .where('tenant_id', '=', scope.tenantId)
    .where('status', '=', 'active')
    .where('deleted_at', 'is', null)
    .executeTakeFirst()

  // Get BCV rate — try venezuela_rates first, fallback to standard cost rate
  let bcvRate: number | null = null
  try {
    const rateRow = await kysely
      .selectFrom('venezuela_rates')
      .select(['bcv_rate'])
      .where('tenant_id', '=', scope.tenantId)
      .orderBy('created_at', 'desc')
      .limit(1)
      .executeTakeFirst()
    if (rateRow) bcvRate = Number((rateRow as any).bcv_rate)
  } catch {
    // venezuela_rates table may not be accessible cross-module — use fallback
    if (stdCost) bcvRate = Number((stdCost as any).bcv_rate_used)
  }

  // Load actual material issues for this order
  const materialIssues = await kysely
    .selectFrom('mfg_order_material_issues')
    .selectAll()
    .where('order_id', '=', orderId)
    .where('tenant_id', '=', scope.tenantId)
    .execute()

  // Load actual operations for labor hours
  const operations = await kysely
    .selectFrom('mfg_order_operations')
    .selectAll()
    .where('order_id', '=', orderId)
    .where('tenant_id', '=', scope.tenantId)
    .execute()

  // Load BOM lines for the order (to calculate quantity variance)
  let bomLines: any[] = []
  if (o.bom_id) {
    bomLines = await kysely
      .selectFrom('mfg_bom_lines')
      .selectAll()
      .where('bom_id', '=', o.bom_id)
      .where('tenant_id', '=', scope.tenantId)
      .execute()
  }

  // Load work center cost rates
  let laborCostPerHrUsd = 5.0 // fallback if no work center config
  if (o.work_center_id) {
    const wc = await kysely
      .selectFrom('mfg_work_centers')
      .select(['cost_per_hr_usd'])
      .where('id', '=', o.work_center_id)
      .executeTakeFirst()
    if (wc && (wc as any).cost_per_hr_usd) laborCostPerHrUsd = Number((wc as any).cost_per_hr_usd)
  }

  // === CALCULATE VARIANCES ===

  const std = stdCost as any

  // 1. Standard total cost for actual production
  const stdCostPerUnit  = std ? Number(std.total_standard_cost_usd) : 0
  const totalStdCostUsd = stdCostPerUnit * actualQty

  // 2. Actual material cost from issues
  let actualMatCostUsd  = 0
  let priceVarianceUsd  = 0
  let qtyVarianceUsd    = 0

  for (const issue of materialIssues as any[]) {
    const issuedQty = Number(issue.issued_quantity)

    // Get actual unit cost from the lot used
    let actualUnitCost: number | null = null
    if (issue.lot_id) {
      const lot = await kysely.selectFrom('mfg_stock_lots').select(['unit_cost_usd']).where('id', '=', issue.lot_id).executeTakeFirst()
      if (lot) actualUnitCost = Number((lot as any).unit_cost_usd ?? 0)
    }

    // Find corresponding BOM line for standard cost
    const bomLine = (bomLines as any[]).find((l) => l.component_id === issue.material_id)
    const stdQtyPerUnit  = bomLine ? Number(bomLine.quantity) * (1 + Number(bomLine.scrap_pct) / 100) : 0
    const stdQtyForOrder = stdQtyPerUnit * actualQty

    // Standard cost for this component (assume RM std cost / total qty distributed equally for simplicity)
    const componentStdUnitCost = std && stdQtyForOrder > 0
      ? (Number(std.raw_material_cost_usd) + Number(std.local_material_cost_usd)) / (planQtyTotal(bomLines as any[]) || 1)
      : 0

    // Price variance: (actual price - std price) × issued qty
    if (actualUnitCost !== null) {
      priceVarianceUsd += (actualUnitCost - componentStdUnitCost) * issuedQty
      actualMatCostUsd += actualUnitCost * issuedQty
    }

    // Quantity variance: (issued - standard) × std price
    qtyVarianceUsd += (issuedQty - stdQtyForOrder) * componentStdUnitCost
  }

  // 3. Labor variance: (actual hrs - standard hrs) × cost/hr
  const actualLaborHrs  = (operations as any[]).reduce((s, op) => s + Number(op.actual_duration_hrs ?? 0), 0)
  const stdLaborHrs     = std ? Number(std.labor_cost_usd) / laborCostPerHrUsd * actualQty : 0
  const laborVarianceUsd = (actualLaborHrs - stdLaborHrs) * laborCostPerHrUsd
  const actualLaborCost  = actualLaborHrs * laborCostPerHrUsd

  const actualCostUsd   = actualMatCostUsd + actualLaborCost
  const totalVariance   = actualCostUsd - totalStdCostUsd

  const now = new Date()

  // Upsert cost variance record
  const existing = await kysely.selectFrom('mfg_cost_variances').select(['id']).where('order_id', '=', orderId).where('tenant_id', '=', scope.tenantId).executeTakeFirst()

  const varianceData = {
    order_id:              orderId,
    order_number:          o.order_number,
    product_code:          o.product_code,
    product_name:          o.product_name,
    planned_quantity:      o.planned_quantity,
    actual_quantity:       actualQty.toFixed(4),
    uom:                   o.uom,
    standard_cost_usd:     totalStdCostUsd.toFixed(4),
    actual_cost_usd:       actualCostUsd.toFixed(4),
    total_variance_usd:    totalVariance.toFixed(4),
    price_variance_usd:    priceVarianceUsd.toFixed(4),
    quantity_variance_usd: qtyVarianceUsd.toFixed(4),
    labor_variance_usd:    laborVarianceUsd.toFixed(4),
    status:                'calculated',
    calculated_at:         now.toISOString(),
    bcv_rate_used:         bcvRate?.toFixed(4) ?? null,
    updated_at:            now.toISOString(),
  }

  if (existing) {
    await kysely.updateTable('mfg_cost_variances').set(varianceData as any).where('id', '=', (existing as any).id).execute()
  } else {
    await kysely.insertInto('mfg_cost_variances').values({
      id: v4(), tenant_id: scope.tenantId, organization_id: scope.organizationId,
      ...varianceData, created_at: now.toISOString(),
    } as any).execute()
  }

  // Update order actual cost
  await kysely.updateTable('mfg_production_orders')
    .set({ actual_cost_usd: actualCostUsd.toFixed(4), updated_at: now } as any)
    .where('id', '=', orderId).execute()

  await emitLifecycle(eventsConfig, 'mfg_costs.variance.calculated', scope, { order_id: orderId, total_variance: totalVariance.toFixed(2) })

  // Alert if unfavorable variance > 10% of standard cost
  if (totalVariance > 0 && totalStdCostUsd > 0 && totalVariance / totalStdCostUsd > 0.10) {
    await emitLifecycle(eventsConfig, 'mfg_costs.variance.unfavorable', scope, { order_id: orderId, variance_pct: ((totalVariance / totalStdCostUsd) * 100).toFixed(1) })
  }

  return Response.json({
    data: {
      order_number:       o.order_number,
      standard_cost_usd:  totalStdCostUsd.toFixed(2),
      actual_cost_usd:    actualCostUsd.toFixed(2),
      total_variance_usd: totalVariance.toFixed(2),
      price_variance_usd: priceVarianceUsd.toFixed(2),
      quantity_variance_usd: qtyVarianceUsd.toFixed(2),
      labor_variance_usd: laborVarianceUsd.toFixed(2),
      favorable:          totalVariance <= 0,
      bcv_rate_used:      bcvRate,
    },
  }, { status: 200 })
}

function planQtyTotal(bomLines: any[]): number {
  return bomLines.reduce((s, l) => s + Number(l.quantity) * (1 + Number(l.scrap_pct) / 100), 0)
}

export async function GET() {
  return Response.json({ message: 'POST order_id to calculate variances' }, { status: 405 })
}
export const openApi = {}
