import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'
import type { EntityManager } from '@mikro-orm/postgresql'
import { SchoolEventEntity } from './data/entities'

type SeedScope = { tenantId: string; organizationId: string }

const VE_HOLIDAYS = [
  { title: 'Año Nuevo', start: '01-01', end: '01-01', type: 'holiday' },
  { title: 'Carnaval (Lunes)', start: '02-12', end: '02-12', type: 'holiday' },
  { title: 'Carnaval (Martes)', start: '02-13', end: '02-13', type: 'holiday' },
  { title: 'Día del Trabajador', start: '05-01', end: '05-01', type: 'holiday' },
  { title: 'Batalla de Carabobo', start: '06-24', end: '06-24', type: 'holiday' },
  { title: 'Día de la Independencia', start: '07-05', end: '07-05', type: 'holiday' },
  { title: 'Natalicio de Bolívar', start: '07-24', end: '07-24', type: 'holiday' },
  { title: 'Día de la Resistencia Indígena', start: '10-12', end: '10-12', type: 'holiday' },
  { title: 'Navidad', start: '12-25', end: '12-25', type: 'holiday' },
  { title: 'Vacaciones de Navidad', start: '12-16', end: '01-07', type: 'holiday' },
  { title: 'Semana Santa', start: '04-14', end: '04-18', type: 'holiday' },
] as const

async function seedSchoolHolidays(em: EntityManager, scope: SeedScope): Promise<void> {
  const existing = await em.find(SchoolEventEntity, {
    tenant_id: scope.tenantId,
    organization_id: scope.organizationId,
    event_type: 'holiday',
    deleted_at: null,
  } as any)

  if (existing.length > 0) return

  const year = new Date().getFullYear()
  const now = new Date()

  for (const holiday of VE_HOLIDAYS) {
    const startMonth = parseInt(holiday.start.split('-')[0])
    const startDay = parseInt(holiday.start.split('-')[1])
    const endMonth = parseInt(holiday.end.split('-')[0])
    const endDay = parseInt(holiday.end.split('-')[1])

    const startYear = startMonth < 8 ? year + 1 : year
    const endYear = endMonth < startMonth ? year + 1 : startYear

    em.persist(
      em.create(SchoolEventEntity, {
        tenant_id: scope.tenantId,
        organization_id: scope.organizationId,
        title: holiday.title,
        event_type: holiday.type,
        start_date: new Date(startYear, startMonth - 1, startDay),
        end_date: new Date(endYear, endMonth - 1, endDay),
        is_all_day: true,
        created_at: now,
        updated_at: now,
      } as any),
    )
  }

  await em.flush()
  console.log(`[school_calendar] Seeded ${VE_HOLIDAYS.length} Venezuelan school holidays`)
}

export const setup: ModuleSetupConfig = {
  async seedDefaults({ em, tenantId, organizationId }) {
    await seedSchoolHolidays(em as EntityManager, { tenantId, organizationId })
  },

  defaultRoleFeatures: {
    admin: ['school_calendar.*'],
    employee: ['school_calendar.view'],
  },
}

export default setup
