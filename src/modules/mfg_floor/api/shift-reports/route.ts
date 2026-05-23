import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { MfgShiftReportEntity } from '../../data/entities'
import { shiftReportCreateSchema, shiftReportUpdateSchema } from '../../data/validators'
const routeMetadata = { GET: { requireAuth: true, requireFeatures: ['mfg_floor.view'] }, POST: { requireAuth: true, requireFeatures: ['mfg_floor.edit'] }, PUT: { requireAuth: true, requireFeatures: ['mfg_floor.edit'] } }
export const metadata = routeMetadata
const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: MfgShiftReportEntity, idField: 'id', orgField: 'organization_id', tenantField: 'tenant_id' },
  indexer: { entityType: 'mfg_floor:shift_report' },
  list: { schema: z.object({ page: z.coerce.number().min(1).default(1), pageSize: z.coerce.number().min(1).max(100).default(30), work_center_id: z.string().uuid().optional(), shift_type: z.string().optional() }).passthrough() },
  create: { schema: shiftReportCreateSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: shiftReportUpdateSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})
export const GET = crud.GET; export const POST = crud.POST; export const PUT = crud.PUT
export const openApi = {}
