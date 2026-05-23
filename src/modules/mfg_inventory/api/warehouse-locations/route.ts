import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { MfgWarehouseLocationEntity } from '../../data/entities'
import { warehouseLocationCreateSchema, warehouseLocationUpdateSchema } from '../../data/validators'

const routeMetadata = {
  GET:    { requireAuth: true, requireFeatures: ['mfg_inventory.view'] },
  POST:   { requireAuth: true, requireFeatures: ['mfg_inventory.receive'] },
  PUT:    { requireAuth: true, requireFeatures: ['mfg_inventory.adjust'] },
  DELETE: { requireAuth: true, requireFeatures: ['mfg_inventory.adjust'] },
}
export const metadata = routeMetadata
const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: MfgWarehouseLocationEntity, idField: 'id', orgField: 'organization_id', tenantField: 'tenant_id', softDeleteField: 'deleted_at' },
  indexer: { entityType: 'mfg_inventory:location' },
  list: { schema: z.object({ page: z.coerce.number().min(1).default(1), pageSize: z.coerce.number().min(1).max(100).default(50), warehouse_type: z.string().optional() }).passthrough() },
  create: { schema: warehouseLocationCreateSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: warehouseLocationUpdateSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})
export const GET = crud.GET; export const POST = crud.POST
export const PUT = crud.PUT; export const DELETE = crud.DELETE
export const openApi = {}
