import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { PropertyEntity } from '../../data/entities'
import { createPropertySchema, updatePropertySchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  search: z.string().optional(),
  property_type: z.string().optional(),
  operation: z.string().optional(),
  status: z.string().optional(),
  city: z.string().optional(),
  min_price: z.coerce.number().optional(),
  max_price: z.coerce.number().optional(),
  min_bedrooms: z.coerce.number().optional(),
  assigned_to: z.string().uuid().optional(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['properties.view'] },
  POST: { requireAuth: true, requireFeatures: ['properties.create'] },
  PUT: { requireAuth: true, requireFeatures: ['properties.edit'] },
  DELETE: { requireAuth: true, requireFeatures: ['properties.delete'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: PropertyEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
    softDeleteField: 'deleted_at',
  },
  indexer: { entityType: 'properties.property' },
  list: { schema: listSchema },
  create: { schema: createPropertySchema },
  update: { schema: updatePropertySchema },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT
export const DELETE = crud.DELETE

export const openApi = {}
