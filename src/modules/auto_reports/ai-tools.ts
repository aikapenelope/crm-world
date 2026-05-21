import { defineAiTool } from '@open-mercato/ai-assistant'
import { z } from 'zod'

// =============================================================================
// Tools: Automotive vertical
// Queries: auto_service_orders, auto_vehicles, auto_parts,
//          auto_inspections, auto_estimates
// =============================================================================

const getWorkshopStatus = defineAiTool({
  name: 'auto.get_workshop_status',
  description: 'Get current workshop status: open orders, in-progress, waiting for parts, ready for pickup. Answer "¿cómo está el taller?" or orders overview.',
  isMutation: false,
  requiredFeatures: ['auto_reports.view'],
  inputSchema: z.object({
    status: z.enum(['received', 'diagnosing', 'waiting_parts', 'in_progress', 'quality_check', 'ready', 'delivered']).optional(),
    limit: z.number().int().min(1).max(30).default(15),
  }),
  async handler(args, ctx) {
    const em = ctx.container.resolve('em')
    const kysely = (em as any).getKysely()

    let query = kysely
      .selectFrom('auto_service_orders')
      .select(['id', 'order_number', 'status', 'vehicle_id', 'assigned_technician', 'estimated_completion', 'total_amount', 'currency'])
      .where('tenant_id', '=', ctx.tenantId)
      .where('organization_id', '=', ctx.organizationId)
      .where('deleted_at', 'is', null)

    if (args.status) query = query.where('status', '=', args.status)

    const orders = await query.orderBy('created_at', 'desc').limit(args.limit).execute()
    const all = orders as any[]

    // Count by status
    const statusCounts: Record<string, number> = {}
    for (const o of all) {
      statusCounts[o.status] = (statusCounts[o.status] ?? 0) + 1
    }

    const readyForPickup = all.filter((o: any) => o.status === 'ready')
    const waitingParts = all.filter((o: any) => o.status === 'waiting_parts')
    const inProgress = all.filter((o: any) => o.status === 'in_progress')

    return {
      total_active: all.length,
      by_status: statusCounts,
      ready_for_pickup: readyForPickup.length,
      waiting_parts: waitingParts.length,
      in_progress: inProgress.length,
      orders: all.slice(0, 10).map((o: any) => ({
        number: o.order_number,
        status: o.status,
        technician: o.assigned_technician,
        estimated_completion: o.estimated_completion,
        total: `${o.currency} ${Number(o.total_amount || 0).toFixed(2)}`,
      })),
    }
  },
})

const getLowPartsInventory = defineAiTool({
  name: 'auto.get_low_parts_inventory',
  description: 'Get parts that are running low. Answer "¿qué repuestos faltan?" or parts inventory status.',
  isMutation: false,
  requiredFeatures: ['auto_reports.view'],
  inputSchema: z.object({
    min_quantity: z.number().int().min(0).default(2).describe('Flag parts with quantity at or below this number'),
  }),
  async handler(args, ctx) {
    const em = ctx.container.resolve('em')
    const kysely = (em as any).getKysely()

    const parts = await kysely
      .selectFrom('auto_parts')
      .select(['id', 'name', 'part_number', 'quantity_available', 'reorder_point', 'unit_cost', 'currency'])
      .where('tenant_id', '=', ctx.tenantId)
      .where('organization_id', '=', ctx.organizationId)
      .where('quantity_available', '<=', args.min_quantity)
      .orderBy('quantity_available', 'asc')
      .execute()

    const all = parts as any[]
    const totalValue = all.reduce((s: number, p: any) => s + (p.quantity_available * Number(p.unit_cost || 0)), 0)

    return {
      low_parts_count: all.length,
      total_remaining_value: totalValue.toFixed(2),
      parts: all.slice(0, 20).map((p: any) => ({
        name: p.name,
        part_number: p.part_number,
        available: p.quantity_available,
        reorder_point: p.reorder_point,
        cost: `${p.currency} ${Number(p.unit_cost || 0).toFixed(2)}`,
      })),
    }
  },
})

const getRevenueByTechnician = defineAiTool({
  name: 'auto.get_revenue_by_technician',
  description: 'Get revenue and orders by technician. Answer "¿cuánto ha generado cada técnico?" or technician productivity.',
  isMutation: false,
  requiredFeatures: ['auto_reports.view'],
  inputSchema: z.object({
    delivered_only: z.boolean().default(true).describe('If true, only count delivered/completed orders'),
  }),
  async handler(args, ctx) {
    const em = ctx.container.resolve('em')
    const kysely = (em as any).getKysely()

    let query = kysely
      .selectFrom('auto_service_orders')
      .select(['assigned_technician', 'total_amount', 'status'])
      .where('tenant_id', '=', ctx.tenantId)
      .where('organization_id', '=', ctx.organizationId)
      .where('deleted_at', 'is', null)

    if (args.delivered_only) query = query.where('status', '=', 'delivered')

    const orders = await query.execute()
    const all = orders as any[]

    // Aggregate by technician
    const byTech = new Map<string, { orders: number; revenue: number }>()
    for (const o of all) {
      const tech = (o.assigned_technician as string) ?? 'Sin asignar'
      const existing = byTech.get(tech) ?? { orders: 0, revenue: 0 }
      byTech.set(tech, {
        orders: existing.orders + 1,
        revenue: existing.revenue + Number(o.total_amount || 0),
      })
    }

    const rankings = Array.from(byTech.entries())
      .sort(([, a], [, b]) => b.revenue - a.revenue)
      .map(([name, stats]) => ({
        technician: name,
        orders: stats.orders,
        revenue: stats.revenue.toFixed(2),
      }))

    return {
      total_orders: all.length,
      total_revenue: all.reduce((s: number, o: any) => s + Number(o.total_amount || 0), 0).toFixed(2),
      by_technician: rankings,
    }
  },
})

const getPendingPickups = defineAiTool({
  name: 'auto.get_pending_pickups',
  description: 'Get vehicles ready for pickup that have not been collected. Answer "¿qué vehículos están listos para entregar?"',
  isMutation: false,
  requiredFeatures: ['auto_reports.view'],
  inputSchema: z.object({}),
  async handler(args, ctx) {
    const em = ctx.container.resolve('em')
    const kysely = (em as any).getKysely()

    const orders = await kysely
      .selectFrom('auto_service_orders')
      .select(['id', 'order_number', 'vehicle_id', 'total_amount', 'currency', 'updated_at'])
      .where('tenant_id', '=', ctx.tenantId)
      .where('organization_id', '=', ctx.organizationId)
      .where('status', '=', 'ready')
      .where('deleted_at', 'is', null)
      .execute()

    const all = orders as any[]

    // Check which ones have been waiting > 1 day
    const now = new Date()
    const waiting = all.map((o: any) => {
      const updated = new Date(o.updated_at)
      const hours = Math.round((now.getTime() - updated.getTime()) / (1000 * 60 * 60))
      return { ...o, hours_waiting: hours }
    }).sort((a, b) => b.hours_waiting - a.hours_waiting)

    return {
      ready_for_pickup: all.length,
      longest_wait_hours: waiting[0]?.hours_waiting ?? 0,
      orders: waiting.slice(0, 10).map((o: any) => ({
        order_number: o.order_number,
        total: `${o.currency} ${Number(o.total_amount || 0).toFixed(2)}`,
        waiting_hours: o.hours_waiting,
      })),
    }
  },
})

const getOverdueOrders = defineAiTool({
  name: 'auto.get_overdue_orders',
  description: 'Get service orders past their estimated completion date. Answer "¿cuáles órdenes están atrasadas?"',
  isMutation: false,
  requiredFeatures: ['auto_reports.view'],
  inputSchema: z.object({}),
  async handler(args, ctx) {
    const em = ctx.container.resolve('em')
    const kysely = (em as any).getKysely()

    const today = new Date().toISOString().split('T')[0]

    const orders = await kysely
      .selectFrom('auto_service_orders')
      .select(['id', 'order_number', 'status', 'assigned_technician', 'estimated_completion'])
      .where('tenant_id', '=', ctx.tenantId)
      .where('organization_id', '=', ctx.organizationId)
      .where('status', 'not in', ['delivered', 'cancelled'])
      .where('estimated_completion', '<', today)
      .where('deleted_at', 'is', null)
      .orderBy('estimated_completion', 'asc')
      .execute()

    const all = orders as any[]

    return {
      overdue_count: all.length,
      orders: all.slice(0, 15).map((o: any) => ({
        number: o.order_number,
        status: o.status,
        technician: o.assigned_technician ?? 'Sin asignar',
        estimated_completion: o.estimated_completion,
      })),
      message: all.length > 0
        ? `⚠️ ${all.length} órdenes atrasadas respecto a la fecha estimada`
        : '✅ No hay órdenes atrasadas',
    }
  },
})

export const aiTools = [
  getWorkshopStatus,
  getLowPartsInventory,
  getRevenueByTechnician,
  getPendingPickups,
  getOverdueOrders,
]

export default aiTools
