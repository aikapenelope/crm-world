import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { MfgCoaEntity } from '../../data/entities'
import { coaCreateSchema, coaUpdateSchema } from '../../data/validators'
const routeMetadata = { GET: { requireAuth: true, requireFeatures: ['mfg_dispatch.view'] }, POST: { requireAuth: true, requireFeatures: ['mfg_dispatch.coa'] }, PUT: { requireAuth: true, requireFeatures: ['mfg_dispatch.coa'] } }
export const metadata = routeMetadata
const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: MfgCoaEntity, idField: 'id', orgField: 'organization_id',
      softDeleteField: null,, tenantField: 'tenant_id' },
  indexer: { entityType: 'mfg_dispatch:coa' },
  list: { schema: z.object({ lot_id: z.string().uuid().optional(), dispatch_order_id: z.string().uuid().optional(), is_released: z.coerce.boolean().optional(), pageSize: z.coerce.number().min(1).max(200).default(100) }).passthrough() },
  create: { schema: coaCreateSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: coaUpdateSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})
export const GET = crud.GET; export const POST = crud.POST; export const PUT = crud.PUT
export const openApi = {}
