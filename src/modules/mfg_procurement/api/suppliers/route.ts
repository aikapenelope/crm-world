import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { MfgSupplierEntity } from '../../data/entities'
import { supplierCreateSchema, supplierUpdateSchema } from '../../data/validators'
const routeMetadata = { GET: { requireAuth: true, requireFeatures: ['mfg_procurement.view'] }, POST: { requireAuth: true, requireFeatures: ['mfg_procurement.create'] }, PUT: { requireAuth: true, requireFeatures: ['mfg_procurement.create'] }, DELETE: { requireAuth: true, requireFeatures: ['mfg_procurement.create'] } }
export const metadata = routeMetadata
const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: MfgSupplierEntity, idField: 'id', orgField: 'organization_id', tenantField: 'tenant_id', softDeleteField: 'deleted_at' },
  indexer: { entityType: 'mfg_procurement:supplier' },
  list: { schema: z.object({ page: z.coerce.number().min(1).default(1), pageSize: z.coerce.number().min(1).max(100).default(50), supplier_type: z.string().optional() }).passthrough() },
  create: { schema: supplierCreateSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: supplierUpdateSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})
export const GET = crud.GET; export const POST = crud.POST; export const PUT = crud.PUT; export const DELETE = crud.DELETE
export const openApi = {}
