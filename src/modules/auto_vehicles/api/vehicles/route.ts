import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { AutoVehicleEntity } from '../../data/entities'
import { createVehicleSchema, updateVehicleSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  search: z.string().optional(),
  customer_id: z.string().uuid().optional(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['auto_vehicles.view'] },
  POST: { requireAuth: true, requireFeatures: ['auto_vehicles.create'] },
  PUT: { requireAuth: true, requireFeatures: ['auto_vehicles.edit'] },
  DELETE: { requireAuth: true, requireFeatures: ['auto_vehicles.edit'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: AutoVehicleEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
    softDeleteField: 'deleted_at',
  },
  indexer: { entityType: 'auto_vehicles.vehicle' },
  list: { schema: listSchema },
  create: { schema: createVehicleSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: updateVehicleSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT
export const DELETE = crud.DELETE

export const openApi = {}
