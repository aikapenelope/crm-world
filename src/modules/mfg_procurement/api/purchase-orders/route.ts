import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { MfgPurchaseOrderEntity } from '../../data/entities'
import { purchaseOrderCreateSchema, purchaseOrderUpdateSchema } from '../../data/validators'
const routeMetadata = { GET: { requireAuth: true, requireFeatures: ['mfg_procurement.view'] }, POST: { requireAuth: true, requireFeatures: ['mfg_procurement.create'] }, PUT: { requireAuth: true, requireFeatures: ['mfg_procurement.track'] }, DELETE: { requireAuth: true, requireFeatures: ['mfg_procurement.create'] } }
export const metadata = routeMetadata
const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: MfgPurchaseOrderEntity, idField: 'id', orgField: 'organization_id', tenantField: 'tenant_id', softDeleteField: 'deleted_at' },
  indexer: { entityType: 'mfg_procurement:purchase_order' },
  list: { schema: z.object({ page: z.coerce.number().min(1).default(1), pageSize: z.coerce.number().min(1).max(100).default(50), status: z.string().optional(), po_type: z.string().optional(), supplier_id: z.string().uuid().optional() }).passthrough() },
  create: { schema: purchaseOrderCreateSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: purchaseOrderUpdateSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})
export const GET = crud.GET; export const POST = crud.POST; export const PUT = crud.PUT; export const DELETE = crud.DELETE
export const openApi = {}
