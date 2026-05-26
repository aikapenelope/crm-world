import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { MfgCycleCountEntity } from '../../data/entities'
import { cycleCountCreateSchema, cycleCountUpdateSchema } from '../../data/validators'

const routeMetadata = {
  GET:  { requireAuth: true, requireFeatures: ['mfg_inventory.view'] },
  POST: { requireAuth: true, requireFeatures: ['mfg_inventory.count'] },
  PUT:  { requireAuth: true, requireFeatures: ['mfg_inventory.count'] },
}
export const metadata = routeMetadata
const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: MfgCycleCountEntity, idField: 'id', orgField: 'organization_id', tenantField: 'tenant_id', softDeleteField: null },
  indexer: { entityType: 'mfg_inventory:cycle_count' },
  list: { schema: z.object({ page: z.coerce.number().min(1).default(1), pageSize: z.coerce.number().min(1).max(100).default(50), status: z.string().optional() }).passthrough() },
  create: { schema: cycleCountCreateSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: cycleCountUpdateSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})
export const GET = crud.GET; export const POST = crud.POST; export const PUT = crud.PUT
export const openApi = {}
