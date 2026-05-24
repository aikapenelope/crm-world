/**
 * Worker: check-maintenance-due
 * POST /api/mfg-maintenance/check-maintenance-due
 *
 * Ejecuta diariamente. Para cada plan de mantenimiento activo:
 *   1. Evalúa si la tarea está vencida o vence en los próximos N días
 *   2. Para planes tipo 'hours': compara next_due_hours vs accumulated_hours del equipo
 *   3. Genera WO automática si el plan está vencido y no tiene WO abierta
 *   4. Verifica stock de repuestos requeridos para las WOs generadas
 *   5. Emite alertas para repuestos por debajo del safety_stock
 */
import { emitLifecycle } from '@/lib/emit-lifecycle'
import { eventsConfig } from '../events'
import { v4 } from 'uuid'

export const metadata = {
  GET:  { requireAuth: true, requireFeatures: ['mfg_maintenance.view'] },
  POST: { requireAuth: true, requireFeatures: ['mfg_maintenance.config'] },
}

export async function POST(request: Request, ctx: any) {
  const em     = ctx.container.resolve('em')
  const scope  = ctx.scope
  const kysely = (em as any).getKysely()

  const now     = new Date()
  const today   = now.toISOString().split('T')[0]
  const in7Days = new Date(now.getTime() + 7 * 86400000).toISOString().split('T')[0]

  const woCreated:    string[] = []
  const overdueCount: string[] = []
  const spareAlerts:  string[] = []

  // 1. Load all active maintenance plans
  const plans = await kysely
    .selectFrom('mfg_maintenance_plans as mp')
    .innerJoin('mfg_equipment as eq', 'eq.id', 'mp.equipment_id')
    .select([
      'mp.id', 'mp.equipment_id', 'mp.equipment_code', 'mp.plan_name',
      'mp.trigger_type', 'mp.trigger_interval', 'mp.next_due_date', 'mp.next_due_hours',
      'mp.requires_shutdown', 'mp.estimated_duration_hrs', 'mp.required_spare_parts',
      'eq.name as equipment_name', 'eq.criticality', 'eq.accumulated_hours', 'eq.status as eq_status',
    ])
    .where('mp.tenant_id', '=', scope.tenantId)
    .where('mp.organization_id', '=', scope.organizationId)
    .where('mp.status', '=', 'active')
    .where('eq.status', '!=', 'retired')
    .execute()

  for (const plan of plans as any[]) {
    const isDueSoon = plan.next_due_date && plan.next_due_date <= in7Days
    const isOverdue  = plan.next_due_date && plan.next_due_date < today

    // Hours-based trigger
    const isHoursDue = plan.trigger_type === 'hours' && plan.next_due_hours &&
      Number(plan.accumulated_hours) >= Number(plan.next_due_hours) - 50 // alert 50h before

    if (!isDueSoon && !isOverdue && !isHoursDue) continue

    if (isOverdue) {
      overdueCount.push(plan.plan_name)
      await emitLifecycle(eventsConfig, 'mfg_maintenance.plan.overdue', scope, {
        plan_name: plan.plan_name, equipment: plan.equipment_code,
      })
      // Mark plan as overdue
      await kysely.updateTable('mfg_maintenance_plans')
        .set({ status: 'overdue' } as any)
        .where('id', '=', plan.id)
        .execute()
    }

    // Check if there's already an open WO for this plan
    const existingWo = await kysely
      .selectFrom('mfg_work_orders_maint')
      .select(['id'])
      .where('maintenance_plan_id', '=', plan.id)
      .where('status', 'in', ['open', 'in_progress'])
      .where('tenant_id', '=', scope.tenantId)
      .executeTakeFirst()

    if (!existingWo) {
      // Generate WO automatically
      const year = now.getFullYear()
      const woNum = `WO-MAINT-${year}-${Date.now().toString().slice(-5)}`
      await kysely.insertInto('mfg_work_orders_maint').values({
        id:               v4(),
        tenant_id:        scope.tenantId,
        organization_id:  scope.organizationId,
        wo_number:        woNum,
        equipment_id:     plan.equipment_id,
        equipment_code:   plan.equipment_code,
        equipment_name:   plan.equipment_name,
        maintenance_plan_id: plan.id,
        work_type:        'preventive',
        priority:         isOverdue ? 'high' : (plan.criticality === 'critical' ? 'critical' : 'medium'),
        status:           'open',
        description:      plan.plan_name,
        estimated_duration_hrs: plan.estimated_duration_hrs,
        scheduled_date:   today,
        created_at:       now.toISOString(),
        updated_at:       now.toISOString(),
      } as any).execute()

      woCreated.push(woNum)
      await emitLifecycle(eventsConfig, 'mfg_maintenance.wo.created', scope, { wo_number: woNum, equipment: plan.equipment_code })
    }

    // 2. Check spare parts stock for this plan
    if (plan.required_spare_parts) {
      const parts = Array.isArray(plan.required_spare_parts) ? plan.required_spare_parts : []
      for (const reqPart of parts) {
        const part = await kysely
          .selectFrom('mfg_spare_parts')
          .select(['part_code', 'part_name', 'current_stock', 'safety_stock', 'reorder_point', 'is_imported'])
          .where('id', '=', reqPart.spare_part_id)
          .where('tenant_id', '=', scope.tenantId)
          .executeTakeFirst()

        if (part && Number((part as any).current_stock) <= Number((part as any).reorder_point)) {
          spareAlerts.push((part as any).part_code)
          await emitLifecycle(eventsConfig, 'mfg_maintenance.spare_part.low_stock', scope, {
            part_code:   (part as any).part_code,
            part_name:   (part as any).part_name,
            current:     (part as any).current_stock,
            minimum:     (part as any).safety_stock,
            is_imported: (part as any).is_imported,
          })
        }
      }
    }
  }

  // 3. Global spare parts scan — any part below reorder_point regardless of plans
  const lowStockParts = await kysely
    .selectFrom('mfg_spare_parts')
    .select(['part_code', 'part_name', 'current_stock', 'reorder_point', 'is_imported', 'lead_time_days'])
    .where('tenant_id', '=', scope.tenantId)
    .where('organization_id', '=', scope.organizationId)
    .where('deleted_at', 'is', null)
    .execute()

  for (const part of lowStockParts as any[]) {
    if (Number(part.current_stock) <= Number(part.reorder_point) && !spareAlerts.includes(part.part_code)) {
      await emitLifecycle(eventsConfig, 'mfg_maintenance.spare_part.low_stock', scope, {
        part_code: part.part_code, current: part.current_stock, is_imported: part.is_imported,
      })
    }
  }

  return Response.json({
    data: {
      work_orders_created: woCreated.length,
      overdue_plans:       overdueCount.length,
      spare_part_alerts:   spareAlerts.length,
      wo_numbers:          woCreated,
    },
  }, { status: 200 })
}

export async function GET() {
  return Response.json({ message: 'POST to run maintenance check' }, { status: 405 })
}
export const openApi = {}
