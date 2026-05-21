/**
 * Generate sessions for a group based on its schedule.
 * Calculates all dates between start_date and end_date
 * that match the schedule_days, then bulk-inserts sessions.
 * Skips sessions that already exist (idempotent).
 */
export const metadata = {
  POST: { requireAuth: true, requireFeatures: ['academy_groups.manage'] },
}

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + minutes
  const endH = Math.floor(total / 60) % 24
  const endM = total % 60
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
}

export async function POST(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()

  const { group_id } = await request.json()
  if (!group_id) return Response.json({ error: 'group_id is required' }, { status: 400 })

  const group = await kysely
    .selectFrom('academy_groups')
    .selectAll()
    .where('id', '=', group_id)
    .where('tenant_id', '=', scope.tenantId)
    .where('organization_id', '=', scope.organizationId)
    .executeTakeFirst()

  if (!group) return Response.json({ error: 'Group not found' }, { status: 404 })
  const g = group as any

  const startDate = new Date(g.start_date)
  const endDate = new Date(g.end_date)
  const scheduleDays: string[] = Array.isArray(g.schedule_days) ? g.schedule_days : []
  const scheduleTime: string = g.schedule_time ?? '08:00'
  const durationMinutes: number = g.session_duration_minutes ?? 90
  const endTime = addMinutesToTime(scheduleTime, durationMinutes)

  // Collect all dates matching schedule_days between start and end
  const sessionDates: Date[] = []
  const cur = new Date(startDate)
  while (cur <= endDate) {
    const dayName = DAY_NAMES[cur.getDay()]
    if (scheduleDays.includes(dayName)) {
      sessionDates.push(new Date(cur))
    }
    cur.setDate(cur.getDate() + 1)
  }

  if (sessionDates.length === 0) {
    return Response.json({ message: 'No sessions to generate — check schedule_days and date range', generated: 0 })
  }

  // Get existing session dates to avoid duplicates
  const existing = await kysely
    .selectFrom('academy_sessions')
    .select(['session_date'])
    .where('group_id', '=', group_id)
    .execute()
  const existingDates = new Set((existing as any[]).map((s: any) => String(s.session_date).slice(0, 10)))

  const now = new Date()
  let sessionNumber = (existing as any[]).length + 1
  const toInsert: any[] = []

  for (const date of sessionDates) {
    const dateStr = date.toISOString().slice(0, 10)
    if (existingDates.has(dateStr)) continue
    toInsert.push({
      id: crypto.randomUUID(),
      group_id,
      tenant_id: scope.tenantId,
      organization_id: scope.organizationId,
      session_number: sessionNumber++,
      session_date: date,
      start_time: scheduleTime,
      end_time: endTime,
      topic: null,
      session_type: 'theory',
      status: 'scheduled',
      instructor_notes: null,
      attendance_count: 0,
      created_at: now,
      updated_at: now,
    })
  }

  if (toInsert.length > 0) {
    await kysely.insertInto('academy_sessions').values(toInsert).execute()
  }

  // Update sessions_count on the group
  await kysely
    .updateTable('academy_groups')
    .set({ sessions_count: (existing as any[]).length + toInsert.length, updated_at: now })
    .where('id', '=', group_id)
    .execute()

  return Response.json({
    generated: toInsert.length,
    total_sessions: (existing as any[]).length + toInsert.length,
    start_date: g.start_date,
    end_date: g.end_date,
  })
}

export const openApi = {}
