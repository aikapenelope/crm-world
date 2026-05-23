import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { MfgSubcontractMaterialEntity } from '../../data/entities'
import { subcontractMaterialCreateSchema, subcontractMaterialUpdateSchema } from '../../data/validators'
const routeMetadata = { GET: { requireAuth: true, requireFeatures: ['mfg_subcontract.view'] }, POST: { requireAuth: true, requireFeatures: ['mfg_subcontract.create'] }, PUT: { requireAuth: true, requireFeatures: ['mfg_subcontract.create'] } }
export const metadata = routeMetadata
const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: MfgSubcontractMaterialEntity, idField: 'id', orgField: 'organization_id', tenantField: 'tenant_id' },
  indexer: { entityType: 'mfg_subcontract:material' },
  list: { schema: z.object({ subcontract_order_id: z.string().uuid().optional(), pageSize: z.coerce.number().min(1).max(200).default(100) }).passthrough() },
  create: { schema: subcontractMaterialCreateSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: subcontractMaterialUpdateSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})
export const GET = crud.GET; export const POST = crud.POST; export const PUT = crud.PUT
export const openApi = {}
