import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { MfgCapacityLoadEntity } from '../../data/entities'
const routeMetadata = { GET: { requireAuth: true, requireFeatures: ['mfg_planning.view'] }, POST: { requireAuth: true, requireFeatures: ['mfg_planning.edit'] }, PUT: { requireAuth: true, requireFeatures: ['mfg_planning.edit'] } }
export const metadata = routeMetadata
const schema = z.object({ work_center_id: z.string().uuid(), work_center_code: z.string().max(30), work_center_name: z.string().max(255), week_start: z.coerce.date(), available_hrs: z.string(), loaded_hrs: z.string().default('0'), utilization_pct: z.string().default('0'), overloaded: z.boolean().default(false) })
const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: MfgCapacityLoadEntity, idField: 'id', orgField: 'organization_id',
      softDeleteField: null,, tenantField: 'tenant_id' },
  indexer: { entityType: 'mfg_planning:capacity_load' },
  list: { schema: z.object({ week_start: z.string().optional(), work_center_id: z.string().uuid().optional(), pageSize: z.coerce.number().min(1).max(200).default(100) }).passthrough() },
  create: { schema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: schema.partial(), applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})
export const GET = crud.GET; export const POST = crud.POST; export const PUT = crud.PUT
export const openApi = {}
