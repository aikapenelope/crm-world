import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { MfgProductionBonusEntity } from '../../data/entities'
import { productionBonusCreateSchema, productionBonusUpdateSchema } from '../../data/validators'
const routeMetadata = { GET: { requireAuth: true, requireFeatures: ['mfg_hr.view'] }, POST: { requireAuth: true, requireFeatures: ['mfg_hr.bonus'] }, PUT: { requireAuth: true, requireFeatures: ['mfg_hr.bonus'] } }
export const metadata = routeMetadata
const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: MfgProductionBonusEntity, idField: 'id', orgField: 'organization_id', tenantField: 'tenant_id', softDeleteField: null },
  indexer: { entityType: 'mfg_hr:production_bonus' },
  list: { schema: z.object({ page: z.coerce.number().min(1).default(1), pageSize: z.coerce.number().min(1).max(100).default(50), status: z.string().optional(), work_center_id: z.string().uuid().optional() }).passthrough() },
  create: { schema: productionBonusCreateSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: productionBonusUpdateSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})
export const GET = crud.GET; export const POST = crud.POST; export const PUT = crud.PUT
export const openApi = {}
