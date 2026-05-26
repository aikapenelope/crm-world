/**
 * POST /api/agri-hr/jornalero-payrolls
 *
 * Custom handler that auto-calculates LOTTT provisions before saving.
 *
 * Venezuelan LOTTT minimum provisions on gross wages:
 *   Vacaciones:          15 días/año = gross × (15/365) = gross × 0.04110
 *   Utilidades:          30 días/año = gross × (30/365) = gross × 0.08219
 *   Prestaciones (1-5y): 15 días/año = gross × (15/365) = gross × 0.04110
 *
 * Total provisions ≈ gross × 0.1644 (minimum LOTTT rates)
 */
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { AgriJornaleroPayrollEntity } from '../../data/entities'
import { jornaleroPayrollCreateSchema, jornaleroPayrollUpdateSchema } from '../../data/validators'
import { emitLifecycle } from '@/lib/emit-lifecycle'
import { eventsConfig } from '../../events'

const VACATION_RATE  = 15 / 365  // 0.04110
const BONUS_RATE     = 30 / 365  // 0.08219
const SEVERANCE_RATE = 15 / 365  // 0.04110

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1), pageSize: z.coerce.number().min(1).max(100).default(50),
  employee_id: z.string().uuid().optional(), status: z.string().optional(),
}).passthrough()

const routeMetadata = {
  GET:  { requireAuth: true, requireFeatures: ['agri_hr.view'] },
  POST: { requireAuth: true, requireFeatures: ['agri_hr.create'] },
  PUT:  { requireAuth: true, requireFeatures: ['agri_hr.approve'] },
}
export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: AgriJornaleroPayrollEntity, idField: 'id', orgField: 'organization_id',
      softDeleteField: null,, tenantField: 'tenant_id' },
  indexer: { entityType: 'agri_hr:payroll' },
  list: { schema: listSchema },
  create: { schema: jornaleroPayrollCreateSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: jornaleroPayrollUpdateSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})

/**
 * Custom POST: auto-calculates LOTTT provisions from gross_usd.
 */
export async function POST(request: Request, ctx: any) {
  const em    = ctx.container.resolve('em')
  const scope = ctx.scope

  let body: any
  try { body = await request.json() } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const parsed = jornaleroPayrollCreateSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 422 })

  const data  = parsed.data
  const gross = Number(data.gross_usd)

  const vacationProvision  = gross * VACATION_RATE
  const bonusProvision     = gross * BONUS_RATE
  const severanceProvision = gross * SEVERANCE_RATE
  const totalProvisions    = vacationProvision + bonusProvision + severanceProvision

  const payroll = em.create(AgriJornaleroPayrollEntity, {
    tenant_id:               scope.tenantId,
    organization_id:         scope.organizationId,
    employee_id:             data.employee_id,
    period_start:            data.period_start,
    period_end:              data.period_end,
    days_worked:             data.days_worked ?? null,
    units_worked:            data.units_worked ?? null,
    gross_usd:               String(gross),
    vacation_provision_usd:  vacationProvision.toFixed(4),
    bonus_provision_usd:     bonusProvision.toFixed(4),
    severance_provision_usd: severanceProvision.toFixed(4),
    total_provisions_usd:    totalProvisions.toFixed(4),
    net_usd:                 data.net_usd,
    status:                  data.status ?? 'draft',
    payment_date:            data.payment_date ?? null,
    notes:                   data.notes ?? null,
  } as any)

  em.persist(payroll)
  await em.flush()

  await emitLifecycle(eventsConfig, 'agri_hr.payroll.approved', scope, { id: payroll.id })

  return Response.json({ data: {
    id:                     payroll.id,
    gross_usd:              gross,
    vacation_provision_usd: vacationProvision.toFixed(4),
    bonus_provision_usd:    bonusProvision.toFixed(4),
    severance_provision_usd: severanceProvision.toFixed(4),
    total_provisions_usd:   totalProvisions.toFixed(4),
  }}, { status: 201 })
}

export const GET = crud.GET
export const PUT = crud.PUT
export const openApi = {}
