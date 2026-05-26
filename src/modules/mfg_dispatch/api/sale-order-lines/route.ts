import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { MfgSaleOrderLineMfgEntity } from '../../data/entities'
import { saleOrderLineCreateSchema, saleOrderLineUpdateSchema } from '../../data/validators'
const routeMetadata = { GET: { requireAuth: true, requireFeatures: ['mfg_dispatch.view'] }, POST: { requireAuth: true, requireFeatures: ['mfg_dispatch.create'] }, PUT: { requireAuth: true, requireFeatures: ['mfg_dispatch.create'] } }
export const metadata = routeMetadata
const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: MfgSaleOrderLineMfgEntity, idField: 'id', orgField: 'organization_id', tenantField: 'tenant_id', softDeleteField: null },
  indexer: { entityType: 'mfg_dispatch:sale_order_line' },
  list: { schema: z.object({ sale_order_id: z.string().uuid().optional(), pageSize: z.coerce.number().min(1).max(200).default(100) }).passthrough() },
  create: { schema: saleOrderLineCreateSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: saleOrderLineUpdateSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})
export const GET = crud.GET; export const POST = crud.POST; export const PUT = crud.PUT
export const openApi = {}
