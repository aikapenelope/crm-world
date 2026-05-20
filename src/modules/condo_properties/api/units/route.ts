import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { CondoUnitEntity } from '../../data/entities'
import { createUnitSchema, updateUnitSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  search: z.string().optional(),
  building_id: z.string().uuid().optional(),
  unit_type: z.string().optional(),
  status: z.string().optional(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['condo_properties.view'] },
  POST: { requireAuth: true, requireFeatures: ['condo_properties.manage'] },
  PUT: { requireAuth: true, requireFeatures: ['condo_properties.manage'] },
  DELETE: { requireAuth: true, requireFeatures: ['condo_properties.manage'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: CondoUnitEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
    softDeleteField: 'deleted_at',
  },
  indexer: { entityType: 'condo_properties.unit' },
  list: { schema: listSchema },
  create: { schema: createUnitSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: updateUnitSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT
export const DELETE = crud.DELETE

export const openApi = {}
