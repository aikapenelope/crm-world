import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { MfgProductionOrderEntity } from '../../data/entities'
import { productionOrderCreateSchema, productionOrderUpdateSchema } from '../../data/validators'

const routeMetadata = {
  GET:    { requireAuth: true, requireFeatures: ['mfg_orders.view'] },
  POST:   { requireAuth: true, requireFeatures: ['mfg_orders.create'] },
  PUT:    { requireAuth: true, requireFeatures: ['mfg_orders.execute'] },
  DELETE: { requireAuth: true, requireFeatures: ['mfg_orders.delete'] },
}
export const metadata = routeMetadata
const listSchema = z.object({
  page: z.coerce.number().min(1).default(1), pageSize: z.coerce.number().min(1).max(100).default(50),
  status: z.string().optional(), work_center_id: z.string().uuid().optional(),
  product_id: z.string().uuid().optional(),
}).passthrough()

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: MfgProductionOrderEntity, idField: 'id', orgField: 'organization_id', tenantField: 'tenant_id', softDeleteField: 'deleted_at' },
  indexer: { entityType: 'mfg_orders:production_order' },
  list: { schema: listSchema },
  create: { schema: productionOrderCreateSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: productionOrderUpdateSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})
export const GET = crud.GET; export const POST = crud.POST
export const PUT = crud.PUT; export const DELETE = crud.DELETE
export const openApi = {}
