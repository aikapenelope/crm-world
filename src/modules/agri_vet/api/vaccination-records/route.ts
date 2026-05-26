import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { AgriVetVaccinationRecordEntity } from '../../data/entities'
import { vaccinationRecordCreateSchema, vaccinationRecordUpdateSchema } from '../../data/validators'

const listSchema = z.object({
  page:     z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(200).default(50),
  flock_id: z.string().uuid().optional(),
  status:   z.string().optional(),
}).passthrough()

const routeMetadata = {
  GET:    { requireAuth: true, requireFeatures: ['agri_vet.view'] },
  POST:   { requireAuth: true, requireFeatures: ['agri_vet.create'] },
  PUT:    { requireAuth: true, requireFeatures: ['agri_vet.edit'] },
  DELETE: { requireAuth: true, requireFeatures: ['agri_vet.delete'] },
}
export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: AgriVetVaccinationRecordEntity, idField: 'id', orgField: 'organization_id', tenantField: 'tenant_id', softDeleteField: null },
  indexer: { entityType: 'agri_vet:vaccination' },
  list: { schema: listSchema },
  create: { schema: vaccinationRecordCreateSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: vaccinationRecordUpdateSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})

export const GET = crud.GET; export const POST = crud.POST
export const PUT = crud.PUT; export const DELETE = crud.DELETE
export const openApi = {}
