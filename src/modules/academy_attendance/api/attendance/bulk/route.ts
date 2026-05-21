/**
 * Bulk save attendance for a session.
 * Upserts records — if a record for enrollment_id+session_id exists, updates it.
 */
export const metadata = {
  POST: { requireAuth: true, requireFeatures: ['academy_attendance.manage'] },
}

export async function POST(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()

  const { session_id, records } = await request.json()

  if (!session_id || !Array.isArray(records)) {
    return Response.json({ error: 'session_id and records[] are required' }, { status: 400 })
  }

  const now = new Date()
  let upserted = 0

  for (const record of records) {
    const { enrollment_id, status, notes } = record
    if (!enrollment_id || !status) continue

    const existing = await kysely
      .selectFrom('academy_attendance')
      .select(['id'])
      .where('session_id', '=', session_id)
      .where('enrollment_id', '=', enrollment_id)
      .executeTakeFirst()

    if (existing) {
      await kysely
        .updateTable('academy_attendance')
        .set({ status, notes: notes ?? null })
        .where('id', '=', (existing as any).id)
        .execute()
    } else {
      await kysely
        .insertInto('academy_attendance')
        .values({
          id: crypto.randomUUID(),
          session_id,
          enrollment_id,
          tenant_id: scope.tenantId,
          organization_id: scope.organizationId,
          status,
          notes: notes ?? null,
          recorded_at: now,
        })
        .execute()
    }
    upserted++
  }

  // Update attendance_count on the session
  const presentCount = records.filter((r: any) => ['present', 'late'].includes(r.status)).length
  await kysely
    .updateTable('academy_sessions')
    .set({ attendance_count: presentCount })
    .where('id', '=', session_id)
    .execute()

  return Response.json({ success: true, upserted, present_count: presentCount })
}

export const openApi = {}
