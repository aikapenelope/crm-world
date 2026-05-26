import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { MfgOrderMaterialIssueEntity } from '../../data/entities'
import { materialIssueCreateSchema } from '../../data/validators'

const routeMetadata = {
  GET:  { requireAuth: true, requireFeatures: ['mfg_orders.view'] },
  POST: { requireAuth: true, requireFeatures: ['mfg_orders.execute'] },
}
export const metadata = routeMetadata
const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: MfgOrderMaterialIssueEntity, idField: 'id', orgField: 'organization_id', tenantField: 'tenant_id', softDeleteField: null },
  indexer: { entityType: 'mfg_orders:material_issue' },
  list: { schema: z.object({ order_id: z.string().uuid().optional(), pageSize: z.coerce.number().min(1).max(500).default(200) }).passthrough() },
  create: { schema: materialIssueCreateSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: materialIssueCreateSchema.partial(), applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})
export const GET = crud.GET; export const POST = crud.POST
export const openApi = {}
