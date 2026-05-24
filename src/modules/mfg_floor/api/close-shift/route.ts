/**
 * Worker: close-shift
 *
 * Se ejecuta automáticamente al cierre de cada turno:
 *   - Turno mañana:  dispara a las 14:00 (Venezuela hora = UTC-4)
 *   - Turno tarde:   dispara a las 22:00
 *   - Turno noche:   dispara a las 06:00
 *
 * También puede ejecutarse manualmente desde el dashboard de piso:
 *   POST /api/mfg-floor/close-shift
 *
 * Algoritmo:
 *   1. Determinar el turno que acaba de cerrar según la hora actual
 *   2. Para cada centro de trabajo activo:
 *      a. Sumar producción real de órdenes en el turno
 *      b. Sumar horas de paro del turno (del módulo mfg_orders)
 *      c. Calcular OEE total e interno
 *      d. Crear MfgShiftReport + MfgOeeHistory
 *   3. Emitir evento shift.closed → notificación al gerente de planta
 */
import { emitLifecycle } from '@app/lib/emit-lifecycle'
import { eventsConfig } from '../events'
import { v4 } from 'uuid'

export const metadata = {
  POST: { requireAuth: true, requireFeatures: ['mfg_floor.edit'] },
}

export async function POST(request: Request, ctx: any) {
  const em     = ctx.container.resolve('em')
  const scope  = ctx.scope
  const kysely = (em as any).getKysely()

  const now     = new Date()
  const hourVE  = (now.getUTCHours() - 4 + 24) % 24  // Venezuela = UTC-4

  // Determine which shift just closed
  let shiftType: string
  let shiftStart: Date
  const shiftEnd = new Date(now)

  if (hourVE >= 6 && hourVE < 14) {
    // Afternoon shift closing morning
    shiftType  = 'morning'
    shiftStart = new Date(now); shiftStart.setUTCHours(shiftStart.getUTCHours() - hourVE + 6); shiftStart.setUTCMinutes(0, 0, 0)
  } else if (hourVE >= 14 && hourVE < 22) {
    shiftType  = 'afternoon'
    shiftStart = new Date(now); shiftStart.setUTCHours(shiftStart.getUTCHours() - hourVE + 14); shiftStart.setUTCMinutes(0, 0, 0)
  } else {
    shiftType  = 'night'
    const h = hourVE >= 22 ? hourVE - 22 : hourVE + 2
    shiftStart = new Date(now); shiftStart.setUTCHours(shiftStart.getUTCHours() - h + (hourVE >= 22 ? 0 : -2)); shiftStart.setUTCMinutes(0, 0, 0)
  }

  const shiftDate = now.toISOString().split('T')[0]
  const reportsGenerated: string[] = []

  // Get all active work centers
  const workCenters = await kysely
    .selectFrom('mfg_work_centers')
    .select(['id', 'code', 'name', 'capacity_hrs_per_shift', 'efficiency_pct'])
    .where('tenant_id', '=', scope.tenantId)
    .where('organization_id', '=', scope.organizationId)
    .where('is_active', '=', true)
    .where('deleted_at', 'is', null)
    .execute()

  for (const wc of workCenters as any[]) {
    // Sum actual production from orders that ran in this work center during this shift
    const prodRows = await kysely
      .selectFrom('mfg_production_orders')
      .select([kysely.fn.sum('actual_quantity').as('total_actual'), kysely.fn.sum('planned_quantity').as('total_planned'), kysely.fn.sum('rejected_quantity').as('total_rejected')])
      .where('tenant_id', '=', scope.tenantId)
      .where('work_center_id', '=', wc.id)
      .where('status', 'in', ['in_progress', 'completed'])
      .where('actual_start', '>=', shiftStart.toISOString())
      .where('actual_start', '<=', shiftEnd.toISOString())
      .executeTakeFirst()

    const actualQty   = Number((prodRows as any)?.total_actual ?? 0)
    const plannedQty  = Number((prodRows as any)?.total_planned ?? 0)
    const rejectedQty = Number((prodRows as any)?.total_rejected ?? 0)

    // Sum downtimes in this shift
    const dtRows = await kysely
      .selectFrom('mfg_production_downtimes')
      .select([
        kysely.fn.sum('duration_hrs').as('total_hrs'),
        kysely.fn.sum(kysely.case().when('is_force_majeure', '=', true).then('duration_hrs').else('0').end()).as('electrical_hrs'),
      ])
      .where('tenant_id', '=', scope.tenantId)
      .where('work_center_id', '=', wc.id)
      .where('started_at', '>=', shiftStart.toISOString())
      .where('started_at', '<=', shiftEnd.toISOString())
      .where('ended_at', 'is not', null)
      .executeTakeFirst()

    const totalDownHrs     = Number((dtRows as any)?.total_hrs ?? 0)
    const electricalHrs    = Number((dtRows as any)?.electrical_hrs ?? 0)
    const internalHrs      = totalDownHrs - electricalHrs
    const availableHrs     = Number(wc.capacity_hrs_per_shift)

    // OEE Availability
    const availPct     = availableHrs > 0 ? Math.max(0, ((availableHrs - totalDownHrs) / availableHrs) * 100) : 100
    const internalPct  = availableHrs > 0 ? Math.max(0, ((availableHrs - internalHrs) / availableHrs) * 100) : 100
    const perfPct      = plannedQty > 0 ? Math.min(100, (actualQty / plannedQty) * 100) : 100
    const qualityPct   = actualQty > 0 ? Math.max(0, ((actualQty - rejectedQty) / actualQty) * 100) : 100
    const oeeTotalPct  = (availPct * perfPct * qualityPct) / 10000

    const year = now.getFullYear()
    const reportNum = `TURNO-${year}-${Date.now().toString().slice(-5)}-${shiftType.charAt(0).toUpperCase()}`

    const reportId = v4()
    await kysely.insertInto('mfg_shift_reports').values({
      id:                     reportId,
      tenant_id:              scope.tenantId,
      organization_id:        scope.organizationId,
      report_number:          reportNum,
      shift_type:             shiftType,
      shift_date:             shiftDate,
      work_center_id:         wc.id,
      work_center_name:       wc.name,
      shift_start:            shiftStart.toISOString(),
      shift_end:              shiftEnd.toISOString(),
      planned_production:     plannedQty.toFixed(4),
      actual_production:      actualQty.toFixed(4),
      rejected_units:         rejectedQty.toFixed(4),
      total_downtime_hrs:     totalDownHrs.toFixed(4),
      electrical_downtime_hrs: electricalHrs.toFixed(4),
      internal_downtime_hrs:  internalHrs.toFixed(4),
      oee_total_pct:          oeeTotalPct.toFixed(2),
      oee_internal_pct:       ((internalPct * perfPct * qualityPct) / 10000).toFixed(2),
      whatsapp_sent:          false,
      created_at:             now.toISOString(),
      updated_at:             now.toISOString(),
    } as any).execute()

    await kysely.insertInto('mfg_oee_history').values({
      id:                     v4(),
      tenant_id:              scope.tenantId,
      organization_id:        scope.organizationId,
      work_center_id:         wc.id,
      work_center_code:       wc.code,
      work_center_name:       wc.name,
      record_date:            shiftDate,
      shift_type:             shiftType,
      available_hrs:          availableHrs.toFixed(4),
      downtime_hrs_total:     totalDownHrs.toFixed(4),
      downtime_hrs_electrical: electricalHrs.toFixed(4),
      downtime_hrs_internal:  internalHrs.toFixed(4),
      planned_quantity:       plannedQty.toFixed(4),
      actual_quantity:        actualQty.toFixed(4),
      rejected_quantity:      rejectedQty.toFixed(4),
      oee_availability_pct:   availPct.toFixed(2),
      oee_internal_pct:       internalPct.toFixed(2),
      oee_performance_pct:    perfPct.toFixed(2),
      oee_quality_pct:        qualityPct.toFixed(2),
      oee_total_pct:          oeeTotalPct.toFixed(2),
      created_at:             now.toISOString(),
    } as any).execute()

    reportsGenerated.push(reportNum)

    // Alert if OEE internal < 65%
    if ((internalPct * perfPct * qualityPct) / 10000 < 65) {
      await emitLifecycle(eventsConfig, 'mfg_floor.oee.below_threshold', scope, {
        work_center: wc.name, oee_internal: ((internalPct * perfPct * qualityPct) / 10000).toFixed(1),
      })
    }

    await emitLifecycle(eventsConfig, 'mfg_floor.shift.closed', scope, {
      work_center: wc.name, shift_type: shiftType, oee_total: oeeTotalPct.toFixed(1),
    })
  }

  return Response.json({
    data: { reports_generated: reportsGenerated.length, reports: reportsGenerated, shift_type: shiftType },
  }, { status: 200 })
}

export const openApi = {}
