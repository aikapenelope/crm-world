import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { MfgStockLotEntity } from '../../data/entities'
import { stockLotCreateSchema, stockLotUpdateSchema } from '../../data/validators'

const routeMetadata = {
  GET:    { requireAuth: true, requireFeatures: ['mfg_inventory.view'] },
  POST:   { requireAuth: true, requireFeatures: ['mfg_inventory.receive'] },
  PUT:    { requireAuth: true, requireFeatures: ['mfg_inventory.adjust'] },
  DELETE: { requireAuth: true, requireFeatures: ['mfg_inventory.adjust'] },
}
export const metadata = routeMetadata
const listSchema = z.object({
  page: z.coerce.number().min(1).default(1), pageSize: z.coerce.number().min(1).max(200).default(50),
  material_id: z.string().uuid().optional(), status: z.string().optional(),
  material_type: z.string().optional(), location_id: z.string().uuid().optional(),
}).passthrough()

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: MfgStockLotEntity, idField: 'id', orgField: 'organization_id',
      softDeleteField: null,, tenantField: 'tenant_id' },
  indexer: { entityType: 'mfg_inventory:lot' },
  list: { schema: listSchema },
  create: { schema: stockLotCreateSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: stockLotUpdateSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})
export const GET = crud.GET; export const POST = crud.POST
export const PUT = crud.PUT; export const DELETE = crud.DELETE
export const openApi = {}
