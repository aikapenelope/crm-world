import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { MfgPurchaseRequisitionEntity } from '../../data/entities'
import { purchaseRequisitionCreateSchema, purchaseRequisitionUpdateSchema } from '../../data/validators'

const routeMetadata = { GET: { requireAuth: true, requireFeatures: ['mfg_mrp.view'] }, POST: { requireAuth: true, requireFeatures: ['mfg_mrp.run'] }, PUT: { requireAuth: true, requireFeatures: ['mfg_mrp.approve'] }, DELETE: { requireAuth: true, requireFeatures: ['mfg_mrp.approve'] } }
export const metadata = routeMetadata
const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: MfgPurchaseRequisitionEntity, idField: 'id', orgField: 'organization_id',
      softDeleteField: null,, tenantField: 'tenant_id' },
  indexer: { entityType: 'mfg_mrp:requisition' },
  list: { schema: z.object({ plan_id: z.string().uuid().optional(), status: z.string().optional(), is_imported: z.coerce.boolean().optional(), pageSize: z.coerce.number().min(1).max(500).default(200) }).passthrough() },
  create: { schema: purchaseRequisitionCreateSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: purchaseRequisitionUpdateSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})
export const GET = crud.GET; export const POST = crud.POST; export const PUT = crud.PUT; export const DELETE = crud.DELETE
export const openApi = {}
