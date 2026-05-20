import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { AutoPartEntity } from '../../data/entities'
import { createPartSchema, updatePartSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  search: z.string().optional(),
  category: z.string().optional(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['auto_parts.view'] },
  POST: { requireAuth: true, requireFeatures: ['auto_parts.manage'] },
  PUT: { requireAuth: true, requireFeatures: ['auto_parts.manage'] },
  DELETE: { requireAuth: true, requireFeatures: ['auto_parts.manage'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: AutoPartEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
    softDeleteField: 'deleted_at',
  },
  indexer: { entityType: 'auto_parts.part' },
  list: { schema: listSchema },
  create: { schema: createPartSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: updatePartSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT
export const DELETE = crud.DELETE

export const openApi = {}
