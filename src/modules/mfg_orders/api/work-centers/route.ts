import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { MfgWorkCenterEntity } from '../../data/entities'
import { workCenterCreateSchema, workCenterUpdateSchema } from '../../data/validators'

const routeMetadata = {
  GET:    { requireAuth: true, requireFeatures: ['mfg_orders.view'] },
  POST:   { requireAuth: true, requireFeatures: ['mfg_orders.create'] },
  PUT:    { requireAuth: true, requireFeatures: ['mfg_orders.create'] },
  DELETE: { requireAuth: true, requireFeatures: ['mfg_orders.delete'] },
}
export const metadata = routeMetadata
const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: MfgWorkCenterEntity, idField: 'id', orgField: 'organization_id', tenantField: 'tenant_id', softDeleteField: 'deleted_at' },
  indexer: { entityType: 'mfg_orders:work_center' },
  list: { schema: z.object({ page: z.coerce.number().min(1).default(1), pageSize: z.coerce.number().min(1).max(100).default(50), type: z.string().optional() }).passthrough() },
  create: { schema: workCenterCreateSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: workCenterUpdateSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})
export const GET = crud.GET; export const POST = crud.POST
export const PUT = crud.PUT; export const DELETE = crud.DELETE
export const openApi = {}
