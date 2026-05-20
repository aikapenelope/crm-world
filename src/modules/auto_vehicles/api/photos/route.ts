import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { AutoVehiclePhotoEntity } from '../../data/entities'
import { createPhotoSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(50).default(20),
  vehicle_id: z.string().uuid().optional(),
  photo_type: z.string().optional(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['auto_vehicles.view'] },
  POST: { requireAuth: true, requireFeatures: ['auto_vehicles.photos'] },
  DELETE: { requireAuth: true, requireFeatures: ['auto_vehicles.photos'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: AutoVehiclePhotoEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
  },
  indexer: { entityType: 'auto_vehicles.photo' },
  list: { schema: listSchema },
  create: { schema: createPhotoSchema, mapToEntity: (input: any) => ({ ...input }) },
})

export const GET = crud.GET
export const POST = crud.POST
export const DELETE = crud.DELETE

export const openApi = {}
