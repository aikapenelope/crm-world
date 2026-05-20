import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { CondoCommonAreaEntity } from '../../data/entities'
import { createCommonAreaSchema, updateCommonAreaSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  building_id: z.string().uuid().optional(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['condo_properties.view'] },
  POST: { requireAuth: true, requireFeatures: ['condo_properties.manage_areas'] },
  PUT: { requireAuth: true, requireFeatures: ['condo_properties.manage_areas'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: CondoCommonAreaEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
  },
  indexer: { entityType: 'condo_properties.common_area' },
  list: { schema: listSchema },
  create: { schema: createCommonAreaSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: updateCommonAreaSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT

export const openApi = {}
