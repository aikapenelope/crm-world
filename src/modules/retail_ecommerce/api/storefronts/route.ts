import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { RetailStorefrontEntity } from '../../data/entities'
import { createStorefrontSchema } from '../../data/validators'
import { z } from 'zod'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['retail_ecommerce.config'] },
  POST: { requireAuth: true, requireFeatures: ['retail_ecommerce.config'] },
  PUT: { requireAuth: true, requireFeatures: ['retail_ecommerce.config'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: RetailStorefrontEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
  },
  indexer: { entityType: 'retail_ecommerce.storefront' },
  list: { schema: listSchema },
  create: {
    schema: createStorefrontSchema,
    mapToEntity: (input: any) => ({ ...input }),
  },
  update: {
    schema: createStorefrontSchema.partial(),
    applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) },
  },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT

export const openApi = {}
