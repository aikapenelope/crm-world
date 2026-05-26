import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { ConstMaterialOrderLineEntity } from '../../data/entities'
import { createOrderLineSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(200).default(100),
  order_id: z.string().uuid().optional(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['const_materials.view'] },
  POST: { requireAuth: true, requireFeatures: ['const_materials.manage'] },
  DELETE: { requireAuth: true, requireFeatures: ['const_materials.manage'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: ConstMaterialOrderLineEntity, idField: 'id', orgField: null as any, tenantField: null as any, softDeleteField: null },
  indexer: { entityType: 'const_materials.order_line' },
  list: { schema: listSchema },
  create: { schema: createOrderLineSchema, mapToEntity: (input: any) => ({ ...input }) },
})

export const GET = crud.GET
export const POST = crud.POST
export const DELETE = crud.DELETE
export const openApi = {}
