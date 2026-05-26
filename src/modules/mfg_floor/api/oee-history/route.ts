import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { MfgOeeHistoryEntity } from '../../data/entities'
const routeMetadata = { GET: { requireAuth: true, requireFeatures: ['mfg_floor.view'] }, POST: { requireAuth: true, requireFeatures: ['mfg_floor.edit'] } }
export const metadata = routeMetadata
const createSchema = z.object({
  work_center_id: z.string().uuid(), work_center_code: z.string().max(30), work_center_name: z.string().max(255),
  record_date: z.coerce.date(), shift_type: z.enum(['morning', 'afternoon', 'night']),
  available_hrs: z.string().default('8.0000'), downtime_hrs_total: z.string().default('0'), downtime_hrs_electrical: z.string().default('0'), downtime_hrs_internal: z.string().default('0'),
  planned_quantity: z.string().default('0'), actual_quantity: z.string().default('0'), rejected_quantity: z.string().default('0'),
  oee_availability_pct: z.string(), oee_internal_pct: z.string(), oee_performance_pct: z.string(), oee_quality_pct: z.string(), oee_total_pct: z.string(),
})
const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: MfgOeeHistoryEntity, idField: 'id', orgField: 'organization_id',
      softDeleteField: null,, tenantField: 'tenant_id' },
  indexer: { entityType: 'mfg_floor:oee_history' },
  list: { schema: z.object({ work_center_id: z.string().uuid().optional(), record_date: z.string().optional(), pageSize: z.coerce.number().min(1).max(200).default(90) }).passthrough() },
  create: { schema: createSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: createSchema.partial(), applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})
export const GET = crud.GET; export const POST = crud.POST
export const openApi = {}
