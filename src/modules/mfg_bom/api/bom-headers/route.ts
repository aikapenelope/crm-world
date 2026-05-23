import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { MfgBomHeaderEntity } from '../../data/entities'
import { bomHeaderCreateSchema, bomHeaderUpdateSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1), pageSize: z.coerce.number().min(1).max(100).default(50),
  product_id: z.string().uuid().optional(), status: z.string().optional(), bom_type: z.string().optional(),
}).passthrough()

const routeMetadata = {
  GET:    { requireAuth: true, requireFeatures: ['mfg_bom.view'] },
  POST:   { requireAuth: true, requireFeatures: ['mfg_bom.create'] },
  PUT:    { requireAuth: true, requireFeatures: ['mfg_bom.edit'] },
  DELETE: { requireAuth: true, requireFeatures: ['mfg_bom.delete'] },
}
export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: MfgBomHeaderEntity, idField: 'id', orgField: 'organization_id', tenantField: 'tenant_id', softDeleteField: 'deleted_at' },
  indexer: { entityType: 'mfg_bom:header' },
  list: { schema: listSchema },
  create: { schema: bomHeaderCreateSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: bomHeaderUpdateSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})
export const GET = crud.GET; export const POST = crud.POST
export const PUT = crud.PUT; export const DELETE = crud.DELETE
export const openApi = {}
