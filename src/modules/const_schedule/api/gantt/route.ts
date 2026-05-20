/**
 * Gantt data — tasks with dependencies for rendering.
 */
export const metadata = {
  GET: { requireAuth: true, requireFeatures: ['const_schedule.view'] },
}

export async function GET(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()
  const url = new URL(request.url)
  const projectId = url.searchParams.get('project_id')

  let query = kysely
    .selectFrom('const_tasks')
    .selectAll()
    .where('tenant_id', '=', scope.tenantId)
    .where('organization_id', '=', scope.organizationId)

  if (projectId) query = query.where('project_id', '=', projectId)

  const tasks = await query.orderBy('sort_order', 'asc').execute()

  const milestones = projectId
    ? await kysely.selectFrom('const_milestones').selectAll()
        .where('project_id', '=', projectId)
        .where('tenant_id', '=', scope.tenantId)
        .orderBy('planned_date', 'asc').execute()
    : []

  // Compute schedule variance per task
  const today = new Date()
  const ganttTasks = (tasks as any[]).map((t: any) => {
    const plannedEnd = new Date(t.planned_end)
    const isDelayed = t.status !== 'completed' && plannedEnd < today
    const daysRemaining = Math.ceil((plannedEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return { ...t, is_delayed: isDelayed, days_remaining: daysRemaining }
  })

  const summary = {
    total_tasks: ganttTasks.length,
    completed: ganttTasks.filter((t: any) => t.status === 'completed').length,
    in_progress: ganttTasks.filter((t: any) => t.status === 'in_progress').length,
    delayed: ganttTasks.filter((t: any) => t.is_delayed).length,
    critical: ganttTasks.filter((t: any) => t.is_critical).length,
    avg_progress: ganttTasks.length > 0
      ? Math.round(ganttTasks.reduce((s: number, t: any) => s + Number(t.progress_percent), 0) / ganttTasks.length)
      : 0,
  }

  return Response.json({ tasks: ganttTasks, milestones, summary })
}

export const openApi = {}
