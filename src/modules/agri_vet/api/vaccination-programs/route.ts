import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { AgriVetVaccinationProgramEntity } from '../../data/entities'
import { vaccinationProgramCreateSchema, vaccinationProgramUpdateSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1), pageSize: z.coerce.number().min(1).max(100).default(50),
  species: z.string().optional(), is_active: z.coerce.boolean().optional(),
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
  orm: { entity: AgriVetVaccinationProgramEntity, idField: 'id', orgField: 'organization_id', tenantField: 'tenant_id', softDeleteField: 'deleted_at' },
  indexer: { entityType: 'agri_vet:vaccination_program' },
  list: { schema: listSchema },
  create: { schema: vaccinationProgramCreateSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: vaccinationProgramUpdateSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})

export const GET = crud.GET; export const POST = crud.POST
export const PUT = crud.PUT; export const DELETE = crud.DELETE
export const openApi = {}
