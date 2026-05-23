import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { MfgQualityPlanEntity } from '../../data/entities'
import { qualityPlanCreateSchema, qualityPlanUpdateSchema } from '../../data/validators'

const routeMetadata = {
  GET:    { requireAuth: true, requireFeatures: ['mfg_quality.view'] },
  POST:   { requireAuth: true, requireFeatures: ['mfg_quality.plans'] },
  PUT:    { requireAuth: true, requireFeatures: ['mfg_quality.plans'] },
  DELETE: { requireAuth: true, requireFeatures: ['mfg_quality.plans'] },
}
export const metadata = routeMetadata
const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: MfgQualityPlanEntity, idField: 'id', orgField: 'organization_id', tenantField: 'tenant_id', softDeleteField: 'deleted_at' },
  indexer: { entityType: 'mfg_quality:plan' },
  list: { schema: z.object({ page: z.coerce.number().min(1).default(1), pageSize: z.coerce.number().min(1).max(100).default(50), product_id: z.string().uuid().optional(), control_point: z.string().optional() }).passthrough() },
  create: { schema: qualityPlanCreateSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: qualityPlanUpdateSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})
export const GET = crud.GET; export const POST = crud.POST
export const PUT = crud.PUT; export const DELETE = crud.DELETE
export const openApi = {}
