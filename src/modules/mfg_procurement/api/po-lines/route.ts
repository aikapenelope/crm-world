import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { MfgPurchaseOrderLineEntity } from '../../data/entities'
import { poLineCreateSchema, poLineUpdateSchema } from '../../data/validators'
const routeMetadata = { GET: { requireAuth: true, requireFeatures: ['mfg_procurement.view'] }, POST: { requireAuth: true, requireFeatures: ['mfg_procurement.create'] }, PUT: { requireAuth: true, requireFeatures: ['mfg_procurement.track'] } }
export const metadata = routeMetadata
const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: MfgPurchaseOrderLineEntity, idField: 'id', orgField: 'organization_id', tenantField: 'tenant_id', softDeleteField: null },
  indexer: { entityType: 'mfg_procurement:po_line' },
  list: { schema: z.object({ po_id: z.string().uuid().optional(), pageSize: z.coerce.number().min(1).max(500).default(200) }).passthrough() },
  create: { schema: poLineCreateSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: poLineUpdateSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})
export const GET = crud.GET; export const POST = crud.POST; export const PUT = crud.PUT
export const openApi = {}
