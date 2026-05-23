/**
 * POST /api/agri-vet/apply-program
 *
 * Applies a vaccination program to an active flock, automatically generating
 * one VaccinationRecord per program entry with:
 *   scheduled_date = flock.start_date + vaccination.age_days
 *   status = 'scheduled'
 *
 * This is the key automation that eliminates manual entry of each vaccination
 * when a new flock starts. The operator selects the program once, and the
 * full vaccination calendar is created in one operation.
 *
 * Body: { flock_id: string, program_id: string }
 * Returns: { created: number, records: [...] }
 */
import { AgriVetVaccinationRecordEntity } from '../../data/entities'

export const metadata = {
  POST: { requireAuth: true, requireFeatures: ['agri_vet.create'] },
}

export async function POST(request: Request, ctx: any) {
  const em     = ctx.container.resolve('em')
  const scope  = ctx.scope
  const kysely = (em as any).getKysely()

  let body: any
  try { body = await request.json() } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { flock_id, program_id } = body
  if (!flock_id || !program_id) {
    return Response.json({ error: 'flock_id and program_id are required' }, { status: 400 })
  }

  // Load the flock
  const flock = await kysely
    .selectFrom('agri_flocks')
    .select(['id', 'start_date', 'initial_count', 'status'])
    .where('id', '=', flock_id)
    .where('tenant_id', '=', scope.tenantId)
    .where('deleted_at', 'is', null)
    .executeTakeFirst()

  if (!flock) return Response.json({ error: 'Flock not found' }, { status: 404 })
  if ((flock as any).status !== 'active') {
    return Response.json({ error: 'Can only apply a program to an active flock' }, { status: 409 })
  }

  // Load the vaccination program
  const program = await kysely
    .selectFrom('agri_vet_vaccination_programs')
    .select(['id', 'name', 'vaccinations', 'is_active'])
    .where('id', '=', program_id)
    .where('tenant_id', '=', scope.tenantId)
    .where('deleted_at', 'is', null)
    .executeTakeFirst()

  if (!program) return Response.json({ error: 'Program not found' }, { status: 404 })

  const vaccinations: any[] = (program as any).vaccinations ?? []
  if (vaccinations.length === 0) {
    return Response.json({ error: 'Program has no vaccination entries' }, { status: 422 })
  }

  // Check if program already applied to this flock (avoid duplicates)
  const existing = await kysely
    .selectFrom('agri_vet_vaccination_records')
    .select(['id'])
    .where('flock_id', '=', flock_id)
    .where('program_id', '=', program_id)
    .where('tenant_id', '=', scope.tenantId)
    .executeTakeFirst()

  if (existing) {
    return Response.json({
      error: 'PROGRAM_ALREADY_APPLIED',
      message: 'Este programa ya fue aplicado a este lote. Para re-aplicar, elimina los registros anteriores primero.',
    }, { status: 409 })
  }

  // Generate VaccinationRecord for each entry
  const startDate = new Date((flock as any).start_date)
  const created = []

  for (const vax of vaccinations) {
    const ageDays = Number(vax.age_days ?? 0)
    const scheduledDate = new Date(startDate)
    scheduledDate.setDate(scheduledDate.getDate() + ageDays)

    const record = em.create(AgriVetVaccinationRecordEntity, {
      tenant_id:            scope.tenantId,
      organization_id:      scope.organizationId,
      flock_id,
      program_id,
      vaccine_name:         vax.vaccine_name ?? 'Sin nombre',
      active_ingredient:    vax.active_ingredient ?? null,
      manufacturer:         vax.manufacturer ?? null,
      administration_route: vax.route ?? 'drinking_water',
      scheduled_date:       scheduledDate,
      status:               'scheduled',
      withdrawal_days:      Number(vax.withdrawal_days ?? 0),
      dose_applied:         vax.dose_per_bird != null ? String(vax.dose_per_bird) : null,
      dose_unit:            vax.dose_unit ?? null,
      notes:                vax.notes ?? null,
    } as any)

    em.persist(record)
    created.push({
      id:             record.id,
      vaccine_name:   vax.vaccine_name,
      age_days:       ageDays,
      scheduled_date: scheduledDate.toISOString().split('T')[0],
    })
  }

  await em.flush()

  return Response.json({
    created: created.length,
    program_name: (program as any).name,
    flock_id,
    records: created,
    message: `${created.length} vacunación(es) programadas automáticamente para ${(program as any).name}`,
  }, { status: 201 })
}

export const openApi = {}
