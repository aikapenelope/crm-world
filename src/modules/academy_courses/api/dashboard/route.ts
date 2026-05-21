/**
 * Academy dashboard — KPIs for the home page widget.
 */
export const metadata = {
  GET: { requireAuth: true, requireFeatures: ['academy_courses.view'] },
}

export async function GET(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()

  const [courses, groups, enrollments] = await Promise.all([
    kysely.selectFrom('academy_courses')
      .select(['is_active'])
      .where('tenant_id', '=', scope.tenantId)
      .where('organization_id', '=', scope.organizationId)
      .where('deleted_at', 'is', null)
      .execute(),

    kysely.selectFrom('academy_groups')
      .select(['status'])
      .where('tenant_id', '=', scope.tenantId)
      .where('organization_id', '=', scope.organizationId)
      .where('deleted_at', 'is', null)
      .execute(),

    kysely.selectFrom('academy_enrollments')
      .select(['status'])
      .where('tenant_id', '=', scope.tenantId)
      .where('organization_id', '=', scope.organizationId)
      .where('deleted_at', 'is', null)
      .execute(),
  ])

  const activeCourses = (courses as any[]).filter((c: any) => c.is_active).length
  const activeGroups = (groups as any[]).filter((g: any) => g.status === 'in_progress').length
  const upcomingGroups = (groups as any[]).filter((g: any) => g.status === 'scheduled').length
  const activeEnrollments = (enrollments as any[]).filter((e: any) => e.status === 'active').length
  const completedEnrollments = (enrollments as any[]).filter((e: any) => e.status === 'completed').length

  return Response.json({
    courses: { total: (courses as any[]).length, active: activeCourses },
    groups: { in_progress: activeGroups, scheduled: upcomingGroups },
    enrollments: { active: activeEnrollments, completed: completedEnrollments },
  })
}

export const openApi = {}
