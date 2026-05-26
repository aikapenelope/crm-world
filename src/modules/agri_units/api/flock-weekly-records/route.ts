import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { AgriFlockWeeklyRecordEntity } from '../../data/entities'
import { flockWeeklyRecordCreateSchema, flockWeeklyRecordUpdateSchema } from '../../data/validators'

const listSchema = z.object({
  page:     z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(200).default(52),
  flock_id: z.string().uuid().optional(),
}).passthrough()

const routeMetadata = {
  GET:    { requireAuth: true, requireFeatures: ['agri_units.view'] },
  POST:   { requireAuth: true, requireFeatures: ['agri_units.weekly_record'] },
  PUT:    { requireAuth: true, requireFeatures: ['agri_units.weekly_record'] },
  DELETE: { requireAuth: true, requireFeatures: ['agri_units.edit'] },
}
export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity:      AgriFlockWeeklyRecordEntity,
    idField:     'id',
    orgField:    'organization_id', tenantField: 'tenant_id',
    // No soft delete — weekly records are immutable audit trail
  },
  indexer: { entityType: 'agri_units:flock_weekly_record' },
  list: { schema: listSchema },
  create: {
    schema: flockWeeklyRecordCreateSchema,
    mapToEntity: (input: any) => ({ ...input }),
  },
  update: {
    schema: flockWeeklyRecordUpdateSchema,
    applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) },
  },
})

export const GET    = crud.GET
export const POST   = crud.POST
export const PUT    = crud.PUT
export const DELETE = crud.DELETE
export const openApi = {}
