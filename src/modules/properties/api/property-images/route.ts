import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { PropertyImageEntity } from '../../data/entities'
import { addPropertyImageSchema } from '../../data/validators'

const listSchema = z.object({
  property_id: z.string().uuid(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(10).default(10),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['properties.view'] },
  POST: { requireAuth: true, requireFeatures: ['properties.edit'] },
  DELETE: { requireAuth: true, requireFeatures: ['properties.edit'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: PropertyImageEntity,
    idField: 'id',
    tenantField: 'tenant_id',
  },
  list: { schema: listSchema },
  create: {
    schema: addPropertyImageSchema,
    mapToEntity: (input: any) => ({ ...input }),
  },
})

export const GET = crud.GET
export const POST = crud.POST
export const DELETE = crud.DELETE

export const openApi = {}
