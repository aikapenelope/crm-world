import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { MfgSubcontractOrderEntity } from '../../data/entities'
import { subcontractOrderCreateSchema, subcontractOrderUpdateSchema } from '../../data/validators'
const routeMetadata = { GET: { requireAuth: true, requireFeatures: ['mfg_subcontract.view'] }, POST: { requireAuth: true, requireFeatures: ['mfg_subcontract.create'] }, PUT: { requireAuth: true, requireFeatures: ['mfg_subcontract.create'] }, DELETE: { requireAuth: true, requireFeatures: ['mfg_subcontract.create'] } }
export const metadata = routeMetadata
const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: MfgSubcontractOrderEntity, idField: 'id', orgField: 'organization_id', tenantField: 'tenant_id', softDeleteField: 'deleted_at' },
  indexer: { entityType: 'mfg_subcontract:order' },
  list: { schema: z.object({ page: z.coerce.number().min(1).default(1), pageSize: z.coerce.number().min(1).max(100).default(50), status: z.string().optional() }).passthrough() },
  create: { schema: subcontractOrderCreateSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: subcontractOrderUpdateSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})
export const GET = crud.GET; export const POST = crud.POST; export const PUT = crud.PUT; export const DELETE = crud.DELETE
export const openApi = {}
