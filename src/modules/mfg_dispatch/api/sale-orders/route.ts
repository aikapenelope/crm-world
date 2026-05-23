import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { MfgSaleOrderMfgEntity } from '../../data/entities'
import { saleOrderCreateSchema, saleOrderUpdateSchema } from '../../data/validators'
const routeMetadata = { GET: { requireAuth: true, requireFeatures: ['mfg_dispatch.view'] }, POST: { requireAuth: true, requireFeatures: ['mfg_dispatch.create'] }, PUT: { requireAuth: true, requireFeatures: ['mfg_dispatch.create'] }, DELETE: { requireAuth: true, requireFeatures: ['mfg_dispatch.create'] } }
export const metadata = routeMetadata
const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: MfgSaleOrderMfgEntity, idField: 'id', orgField: 'organization_id', tenantField: 'tenant_id', softDeleteField: 'deleted_at' },
  indexer: { entityType: 'mfg_dispatch:sale_order' },
  list: { schema: z.object({ page: z.coerce.number().min(1).default(1), pageSize: z.coerce.number().min(1).max(100).default(50), status: z.string().optional(), customer_id: z.string().uuid().optional() }).passthrough() },
  create: { schema: saleOrderCreateSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: saleOrderUpdateSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})
export const GET = crud.GET; export const POST = crud.POST; export const PUT = crud.PUT; export const DELETE = crud.DELETE
export const openApi = {}
