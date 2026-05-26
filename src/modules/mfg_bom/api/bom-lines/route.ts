import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { MfgBomLineEntity } from '../../data/entities'
import { bomLineCreateSchema, bomLineUpdateSchema } from '../../data/validators'

const routeMetadata = {
  GET:    { requireAuth: true, requireFeatures: ['mfg_bom.view'] },
  POST:   { requireAuth: true, requireFeatures: ['mfg_bom.edit'] },
  PUT:    { requireAuth: true, requireFeatures: ['mfg_bom.edit'] },
  DELETE: { requireAuth: true, requireFeatures: ['mfg_bom.edit'] },
}
export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: MfgBomLineEntity, idField: 'id', orgField: 'organization_id',
      softDeleteField: null,, tenantField: 'tenant_id' },
  indexer: { entityType: 'mfg_bom:line' },
  list: { schema: z.object({ page: z.coerce.number().min(1).default(1), pageSize: z.coerce.number().min(1).max(500).default(200), bom_id: z.string().uuid().optional() }).passthrough() },
  create: { schema: bomLineCreateSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: bomLineUpdateSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})
export const GET = crud.GET; export const POST = crud.POST
export const PUT = crud.PUT; export const DELETE = crud.DELETE
export const openApi = {}
