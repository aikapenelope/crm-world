/**
 * POST /api/mfg-mrp/run-mrp?plan_id=<uuid>
 *
 * Motor MRP completo. Ejecuta la explosión de necesidades de materiales
 * para todas las órdenes de producción dentro del período del plan.
 *
 * Algoritmo:
 *   1. Cargar órdenes de producción en el período (planned + released)
 *   2. Explotar BOM de cada orden → necesidades brutas por material
 *   3. Consolidar necesidades brutas por material_id
 *   4. Cargar posición de stock (lotes disponibles por material)
 *   5. Calcular necesidades netas = max(0, bruta - stock)
 *   6. Consultar lead times del proveedor (o default por material_type)
 *   7. Crear MfgMrpRequirement por cada material
 *   8. Crear MfgPurchaseRequisition para net_requirement > 0
 *   9. Actualizar plan con resumen de la corrida
 *
 * Lead times venezolanos por defecto:
 *   Nacional:  15 días
 *   Importado: 60 días (trámite divisas + embarque + flete + aduana + transporte)
 */

import { emitLifecycle } from '@/lib/emit-lifecycle'
import { eventsConfig } from '../../events'
import { v4 } from 'uuid'

export const metadata = {
  GET:  { requireAuth: true, requireFeatures: ['mfg_mrp.view'] },
  POST: { requireAuth: true, requireFeatures: ['mfg_mrp.run'] },
}

export async function POST(request: Request, ctx: any) {
  const em     = ctx.container.resolve('em')
  const scope  = ctx.scope
  const kysely = (em as any).getKysely()

  const url    = new URL(request.url)
  const planId = url.searchParams.get('plan_id')
  if (!planId) return Response.json({ error: 'plan_id required' }, { status: 400 })

  // 1. Load plan
  const plan = await kysely
    .selectFrom('mfg_production_plans')
    .selectAll()
    .where('id', '=', planId)
    .where('tenant_id', '=', scope.tenantId)
    .where('deleted_at', 'is', null)
    .executeTakeFirst()

  if (!plan) return Response.json({ error: 'Plan not found' }, { status: 404 })

  // Mark plan as running
  await kysely.updateTable('mfg_production_plans')
    .set({ status: 'running' } as any)
    .where('id', '=', planId)
    .execute()

  try {
    // 2. Load production orders in plan period
    const orders = await kysely
      .selectFrom('mfg_production_orders')
      .select(['id', 'bom_id', 'planned_quantity', 'uom', 'scheduled_start', 'product_code', 'product_name'])
      .where('tenant_id', '=', scope.tenantId)
      .where('organization_id', '=', scope.organizationId)
      .where('status', 'in', ['planned', 'released'])
      .where('scheduled_start', '>=', (plan as any).period_start)
      .where('scheduled_start', '<=', (plan as any).period_end)
      .where('deleted_at', 'is', null)
      .execute()

    // 3. Explode BOMs → gross requirements by material
    const grossMap: Map<string, {
      material_id: string; material_code: string; material_name: string
      material_type: string; uom: string; gross: number; earliest_need: Date
    }> = new Map()

    for (const order of orders as any[]) {
      if (!order.bom_id) continue
      const bomLines = await kysely
        .selectFrom('mfg_bom_lines')
        .selectAll()
        .where('bom_id', '=', order.bom_id)
        .where('tenant_id', '=', scope.tenantId)
        .execute()

      const orderQty = Number(order.planned_quantity)
      const needDate = order.scheduled_start ? new Date(order.scheduled_start) : new Date(Date.now() + 14 * 86400000)

      for (const line of bomLines as any[]) {
        const qty = Number(line.quantity) * (1 + Number(line.scrap_pct) / 100) * orderQty
        const key = line.component_id

        const existing = grossMap.get(key)
        if (existing) {
          existing.gross += qty
          if (needDate < existing.earliest_need) existing.earliest_need = needDate
        } else {
          grossMap.set(key, {
            material_id:   line.component_id,
            material_code: line.component_code,
            material_name: line.component_name,
            material_type: line.component_type,
            uom:           line.uom,
            gross:         qty,
            earliest_need: needDate,
          })
        }
      }
    }

    // 4. Load current available stock per material (FEFO = available lots only)
    const materialIds = Array.from(grossMap.keys())
    const stockMap: Map<string, number> = new Map()

    if (materialIds.length > 0) {
      const stockRows = await kysely
        .selectFrom('mfg_stock_lots')
        .select(['material_id', kysely.fn.sum('quantity').as('total_qty')])
        .where('tenant_id', '=', scope.tenantId)
        .where('organization_id', '=', scope.organizationId)
        .where('status', 'in', ['available', 'reserved'])
        .where('material_id', 'in', materialIds)
        .groupBy('material_id')
        .execute()

      for (const row of stockRows as any[]) {
        stockMap.set(row.material_id, Number(row.total_qty))
      }
    }

    // 5. Delete previous requirements for this plan (re-run MRP)
    await kysely.deleteFrom('mfg_mrp_requirements')
      .where('plan_id', '=', planId)
      .where('tenant_id', '=', scope.tenantId)
      .execute()

    // Default lead times: national 15d, imported 60d
    const DEFAULT_LEAD_NATIONAL  = 15
    const DEFAULT_LEAD_IMPORT    = 60

    const now          = new Date()
    const requirementsCreated: number[] = []
    const requisitionsCreated: number[] = []
    const atRisk: string[] = []

    for (const [, mat] of grossMap) {
      const onHand    = stockMap.get(mat.material_id) ?? 0
      const netReq    = Math.max(0, mat.gross - onHand)
      const isImported = mat.material_type === 'raw_material' // Simplified — Sprint C will have supplier data
      const leadDays   = isImported ? DEFAULT_LEAD_IMPORT : DEFAULT_LEAD_NATIONAL

      const requiredBy     = new Date(mat.earliest_need)
      const suggestedPoDate = new Date(requiredBy.getTime() - leadDays * 86400000)

      const reqId = v4()
      await kysely.insertInto('mfg_mrp_requirements').values({
        id:               reqId,
        tenant_id:        scope.tenantId,
        organization_id:  scope.organizationId,
        plan_id:          planId,
        material_id:      mat.material_id,
        material_code:    mat.material_code,
        material_name:    mat.material_name,
        material_type:    mat.material_type,
        uom:              mat.uom,
        gross_requirement: mat.gross.toFixed(4),
        stock_on_hand:    onHand.toFixed(4),
        stock_in_transit: '0.0000',
        net_requirement:  netReq.toFixed(4),
        required_by_date: requiredBy.toISOString().split('T')[0],
        suggested_po_date: suggestedPoDate.toISOString().split('T')[0],
        lead_time_days:   leadDays,
        is_imported:      isImported,
        status:           netReq > 0 ? 'pending' : 'covered',
        created_at:       now.toISOString(),
        updated_at:       now.toISOString(),
      } as any).execute()

      requirementsCreated.push(1)

      // Flag at-risk: PO date is within 7 days or already past
      const daysUntilPo = Math.ceil((suggestedPoDate.getTime() - now.getTime()) / 86400000)
      if (netReq > 0 && daysUntilPo <= 7) {
        atRisk.push(mat.material_code)
        if (daysUntilPo < 0) {
          await emitLifecycle(eventsConfig, 'mfg_mrp.po_date_overdue', scope, { material_code: mat.material_code })
        } else {
          await emitLifecycle(eventsConfig, 'mfg_mrp.requirement.at_risk', scope, { material_code: mat.material_code })
        }
      }

      // 6. Auto-create purchase requisition for net requirements
      if (netReq > 0) {
        const year = now.getFullYear()
        const reqNum = `REQ-${year}-${Date.now().toString().slice(-5)}`
        await kysely.insertInto('mfg_purchase_requisitions').values({
          id:                   v4(),
          tenant_id:            scope.tenantId,
          organization_id:      scope.organizationId,
          requisition_number:   reqNum,
          mrp_requirement_id:   reqId,
          material_id:          mat.material_id,
          material_code:        mat.material_code,
          material_name:        mat.material_name,
          quantity:             netReq.toFixed(4),
          uom:                  mat.uom,
          required_by_date:     requiredBy.toISOString().split('T')[0],
          suggested_po_date:    suggestedPoDate.toISOString().split('T')[0],
          is_imported:          isImported,
          status:               'pending',
          customs_days_estimate: isImported ? 15 : null,
          created_at:           now.toISOString(),
          updated_at:           now.toISOString(),
        } as any).execute()

        requisitionsCreated.push(1)
        await emitLifecycle(eventsConfig, 'mfg_mrp.requisition.generated', scope, { material_code: mat.material_code })
      }
    }

    // 7. Update plan summary
    const summary = {
      orders_exploded:     (orders as any[]).length,
      materials_analyzed:  grossMap.size,
      requirements_created: requirementsCreated.length,
      requisitions_created: requisitionsCreated.length,
      at_risk_materials:   atRisk,
      run_at:              now.toISOString(),
    }

    await kysely.updateTable('mfg_production_plans')
      .set({ status: 'completed', last_run_at: now, last_run_summary: JSON.stringify(summary) } as any)
      .where('id', '=', planId)
      .execute()

    await emitLifecycle(eventsConfig, 'mfg_mrp.run.completed', scope, { plan_id: planId, ...summary })

    return Response.json({ data: summary }, { status: 200 })

  } catch (err: any) {
    await kysely.updateTable('mfg_production_plans')
      .set({ status: 'draft' } as any)
      .where('id', '=', planId)
      .execute()
    return Response.json({ error: 'MRP run failed', details: err?.message }, { status: 500 })
  }
}

export async function GET(request: Request, ctx: any) {
  return Response.json({ message: 'Use POST to run MRP. GET not supported on this endpoint.' }, { status: 405 })
}

export const openApi = {}
