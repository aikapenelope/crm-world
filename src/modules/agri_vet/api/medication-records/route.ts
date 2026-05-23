import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { AgriVetMedicationRecordEntity } from '../../data/entities'
import { medicationRecordCreateSchema, medicationRecordUpdateSchema } from '../../data/validators'

const listSchema = z.object({
  page:     z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(200).default(50),
  flock_id: z.string().uuid().optional(),
  resolved: z.coerce.boolean().optional(),
}).passthrough()

const routeMetadata = {
  GET:    { requireAuth: true, requireFeatures: ['agri_vet.view'] },
  POST:   { requireAuth: true, requireFeatures: ['agri_vet.prescribe'] },
  PUT:    { requireAuth: true, requireFeatures: ['agri_vet.prescribe'] },
  DELETE: { requireAuth: true, requireFeatures: ['agri_vet.delete'] },
}
export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: AgriVetMedicationRecordEntity, idField: 'id', orgField: 'organization_id', tenantField: 'tenant_id' },
  indexer: { entityType: 'agri_vet:medication' },
  list: { schema: listSchema },
  create: { schema: medicationRecordCreateSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: medicationRecordUpdateSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})

export const GET = crud.GET; export const POST = crud.POST
export const PUT = crud.PUT; export const DELETE = crud.DELETE
export const openApi = {}
