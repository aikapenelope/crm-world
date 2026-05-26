import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { MfgBomAlternativeEntity } from '../../data/entities'
import { bomAlternativeCreateSchema, bomAlternativeUpdateSchema } from '../../data/validators'

const routeMetadata = {
  GET:    { requireAuth: true, requireFeatures: ['mfg_bom.view'] },
  POST:   { requireAuth: true, requireFeatures: ['mfg_bom.edit'] },
  PUT:    { requireAuth: true, requireFeatures: ['mfg_bom.edit'] },
  DELETE: { requireAuth: true, requireFeatures: ['mfg_bom.edit'] },
}
export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: MfgBomAlternativeEntity, idField: 'id', orgField: 'organization_id', tenantField: 'tenant_id', softDeleteField: null },
  indexer: { entityType: 'mfg_bom:alternative' },
  list: { schema: z.object({ bom_line_id: z.string().uuid().optional(), pageSize: z.coerce.number().min(1).max(100).default(50) }).passthrough() },
  create: { schema: bomAlternativeCreateSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: bomAlternativeUpdateSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})
export const GET = crud.GET; export const POST = crud.POST
export const PUT = crud.PUT; export const DELETE = crud.DELETE
export const openApi = {}
