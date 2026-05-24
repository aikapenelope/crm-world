import { defineAiTool } from '@open-mercato/ai-assistant'
import { z } from 'zod'

// =============================================================================
// Read tools — project overview, budget, RFIs, progress
// =============================================================================

const getProjectOverview = defineAiTool({
  name: 'const.get_project_overview',
  description: 'Get complete project overview: progress, budget, billed amount, open RFIs, pending valuations.',
  isMutation: false,
  requiredFeatures: ['const_projects.view'],
  inputSchema: z.object({
    project_id: z.string().uuid().describe('Project ID').optional(),
    project_name: z.string().optional().describe('Search by project name (partial match)'),
  }),
  async handler(args: any, ctx: any) {
    const em = ctx.container.resolve('em')
    const kysely = (em as any).getKysely()

    let query = kysely
      .selectFrom('const_projects')
      .select(['id', 'name', 'code', 'status', 'contract_amount', 'overall_progress', 'currency', 'planned_end_date', 'project_manager'])
      .where('tenant_id', '=', ctx.tenantId)
      .where('organization_id', '=', ctx.organizationId)
      .where('deleted_at', 'is', null)

    if (args.project_id) query = query.where('id', '=', args.project_id)
    if (args.project_name) query = query.where('name', 'ilike', `%${args.project_name}%`)

    const projects = await query.limit(5).execute()
    return { projects, total: (projects as any[]).length }
  },
})

const getBudgetVsActual = defineAiTool({
  name: 'const.get_budget_vs_actual',
  description: 'Compare budget vs actual billed amount and progress for a project.',
  isMutation: false,
  requiredFeatures: ['const_projects.view'],
  inputSchema: z.object({
    project_id: z.string().uuid(),
  }),
  async handler(args: any, ctx: any) {
    const em = ctx.container.resolve('em')
    const kysely = (em as any).getKysely()

    const project = await kysely
      .selectFrom('const_projects')
      .select(['name', 'contract_amount', 'overall_progress', 'currency'])
      .where('id', '=', args.project_id)
      .where('tenant_id', '=', ctx.tenantId)
      .executeTakeFirst()

    if (!project) return { error: 'Project not found' }

    const budgetItems = await kysely
      .selectFrom('const_budget_items')
      .select(['total_cost'])
      .where('project_id', '=', args.project_id)
      .where('tenant_id', '=', ctx.tenantId)
      .where('is_chapter', '=', false)
      .execute()

    const totalBudget = (budgetItems as any[]).reduce((s: number, i: any) => s + Number(i.total_cost), 0)

    const valuations = await kysely
      .selectFrom('const_valuations')
      .select(['current_period', 'net_payable', 'status'])
      .where('project_id', '=', args.project_id)
      .where('tenant_id', '=', ctx.tenantId)
      .execute()

    const totalBilled = (valuations as any[])
      .filter((v: any) => ['approved', 'invoiced', 'paid'].includes(v.status))
      .reduce((s: number, v: any) => s + Number(v.current_period), 0)

    const p = project as any

    return {
      project_name: p.name,
      contract_amount: p.contract_amount,
      total_budget: totalBudget.toFixed(2),
      total_billed: totalBilled.toFixed(2),
      billing_rate: Number(p.contract_amount) > 0
        ? Math.round((totalBilled / Number(p.contract_amount)) * 100)
        : 0,
      overall_progress: p.overall_progress,
      currency: p.currency,
    }
  },
})

const getOverdueRFIs = defineAiTool({
  name: 'const.get_overdue_rfis',
  description: 'Get RFIs that are past their due date without a response. Useful for "what RFIs are overdue?"',
  isMutation: false,
  requiredFeatures: ['const_rfis.view'],
  inputSchema: z.object({
    project_id: z.string().uuid().optional(),
  }),
  async handler(args: any, ctx: any) {
    const em = ctx.container.resolve('em')
    const kysely = (em as any).getKysely()

    const today = new Date().toISOString().split('T')[0]
    let query = kysely
      .selectFrom('const_rfis')
      .select(['id', 'rfi_number', 'subject', 'discipline', 'priority', 'assigned_to', 'due_date'])
      .where('tenant_id', '=', ctx.tenantId)
      .where('organization_id', '=', ctx.organizationId)
      .where('status', 'in', ['open', 'pending_response'])
      .where('due_date', '<', today)

    if (args.project_id) query = query.where('project_id', '=', args.project_id)

    const rfis = await query.orderBy('due_date', 'asc').execute()
    return { overdue_rfis: rfis, count: (rfis as any[]).length }
  },
})

const getPendingValuations = defineAiTool({
  name: 'const.get_pending_valuations',
  description: 'Get valuations pending approval or payment. Answer "what valuations are pending?"',
  isMutation: false,
  requiredFeatures: ['const_progress.view'],
  inputSchema: z.object({
    project_id: z.string().uuid().optional(),
  }),
  async handler(args: any, ctx: any) {
    const em = ctx.container.resolve('em')
    const kysely = (em as any).getKysely()

    let query = kysely
      .selectFrom('const_valuations')
      .select(['id', 'valuation_number', 'period_from', 'period_to', 'current_period', 'net_payable', 'status', 'currency'])
      .where('tenant_id', '=', ctx.tenantId)
      .where('organization_id', '=', ctx.organizationId)
      .where('status', 'in', ['draft', 'submitted', 'approved'])

    if (args.project_id) query = query.where('project_id', '=', args.project_id)

    const valuations = await query.orderBy('period_from', 'asc').execute()
    const totalPending = (valuations as any[]).reduce((s: number, v: any) => s + Number(v.net_payable), 0)

    return {
      pending_valuations: valuations,
      count: (valuations as any[]).length,
      total_pending: totalPending.toFixed(2),
      currency: 'USD',
    }
  },
})

const getMaterialAlerts = defineAiTool({
  name: 'const.get_material_alerts',
  description: 'Get materials that are over budget or have critical stock levels.',
  isMutation: false,
  requiredFeatures: ['const_materials.view'],
  inputSchema: z.object({
    project_id: z.string().uuid().optional(),
  }),
  async handler(args: any, ctx: any) {
    const em = ctx.container.resolve('em')
    const kysely = (em as any).getKysely()

    let query = kysely
      .selectFrom('const_material_stock')
      .select(['material_name', 'unit', 'budget_quantity', 'consumed_quantity', 'received_quantity'])
      .where('tenant_id', '=', ctx.tenantId)
      .where('organization_id', '=', ctx.organizationId)

    if (args.project_id) query = query.where('project_id', '=', args.project_id)

    const stock = await query.execute()
    const alerts = (stock as any[])
      .filter((s: any) => Number(s.consumed_quantity) > Number(s.budget_quantity))
      .map((s: any) => ({
        material: s.material_name,
        unit: s.unit,
        budget: s.budget_quantity,
        consumed: s.consumed_quantity,
        variance: (Number(s.consumed_quantity) - Number(s.budget_quantity)).toFixed(4),
      }))

    return { alerts, count: alerts.length, message: alerts.length > 0 ? `${alerts.length} material(es) sobre presupuesto` : 'Sin alertas de materiales' }
  },
})

const getScheduleStatus = defineAiTool({
  name: 'const.get_schedule_status',
  description: 'Get schedule status: delayed tasks, completion rate, milestones at risk.',
  isMutation: false,
  requiredFeatures: ['const_schedule.view'],
  inputSchema: z.object({
    project_id: z.string().uuid().optional(),
  }),
  async handler(args: any, ctx: any) {
    const em = ctx.container.resolve('em')
    const kysely = (em as any).getKysely()

    const today = new Date().toISOString().split('T')[0]
    let query = kysely
      .selectFrom('const_tasks')
      .select(['id', 'name', 'status', 'planned_end', 'progress_percent', 'is_critical'])
      .where('tenant_id', '=', ctx.tenantId)
      .where('organization_id', '=', ctx.organizationId)

    if (args.project_id) query = query.where('project_id', '=', args.project_id)

    const tasks = await query.execute()
    const total = (tasks as any[]).length
    const completed = (tasks as any[]).filter((t: any) => t.status === 'completed').length
    const delayed = (tasks as any[]).filter((t: any) =>
      t.status !== 'completed' && t.planned_end < today
    )
    const critical = (tasks as any[]).filter((t: any) => t.is_critical && t.status !== 'completed')

    return {
      total_tasks: total,
      completed,
      completion_rate: total > 0 ? Math.round((completed / total) * 100) : 0,
      delayed_count: delayed.length,
      critical_pending: critical.length,
      delayed_tasks: delayed.map((t: any) => ({ name: t.name, planned_end: t.planned_end })).slice(0, 5),
    }
  },
})

// =============================================================================
// Export
// =============================================================================

export const aiTools = [
  getProjectOverview,
  getBudgetVsActual,
  getOverdueRFIs,
  getPendingValuations,
  getMaterialAlerts,
  getScheduleStatus,
]

export default aiTools
