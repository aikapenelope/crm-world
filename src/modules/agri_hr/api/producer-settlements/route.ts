import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { AgriProducerSettlementEntity } from '../../data/entities'
import { producerSettlementCreateSchema, producerSettlementUpdateSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1), pageSize: z.coerce.number().min(1).max(100).default(50),
  producer_id: z.string().uuid().optional(), status: z.string().optional(), flock_id: z.string().uuid().optional(),
}).passthrough()

const routeMetadata = {
  GET:    { requireAuth: true, requireFeatures: ['agri_hr.view'] },
  POST:   { requireAuth: true, requireFeatures: ['agri_hr.create'] },
  PUT:    { requireAuth: true, requireFeatures: ['agri_hr.approve'] },
  DELETE: { requireAuth: true, requireFeatures: ['agri_hr.delete'] },
}
export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: AgriProducerSettlementEntity, idField: 'id', orgField: 'organization_id', tenantField: 'tenant_id' },
  indexer: { entityType: 'agri_hr:settlement' },
  list: { schema: listSchema },
  create: { schema: producerSettlementCreateSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: producerSettlementUpdateSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})
export const GET = crud.GET; export const POST = crud.POST
export const PUT = crud.PUT; export const DELETE = crud.DELETE
export const openApi = {}
