import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { ConstMaterialOrderEntity } from '../../data/entities'
import { createOrderSchema, updateOrderSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  project_id: z.string().uuid().optional(),
  status: z.string().optional(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['const_materials.view'] },
  POST: { requireAuth: true, requireFeatures: ['const_materials.manage'] },
  PUT: { requireAuth: true, requireFeatures: ['const_materials.manage'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: ConstMaterialOrderEntity, idField: 'id', orgField: 'organization_id', tenantField: 'tenant_id' },
  indexer: { entityType: 'const_materials.order' },
  list: { schema: listSchema },
  create: { schema: createOrderSchema, mapToEntity: (input: any) => ({ ...input, order_number: `OC-${Date.now().toString(36).toUpperCase().slice(-5)}` }) },
  update: { schema: updateOrderSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT
export const openApi = {}
