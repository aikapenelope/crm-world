import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { MfgWorkerEntity } from '../../data/entities'
import { workerCreateSchema, workerUpdateSchema } from '../../data/validators'
const routeMetadata = { GET: { requireAuth: true, requireFeatures: ['mfg_hr.view'] }, POST: { requireAuth: true, requireFeatures: ['mfg_hr.manage'] }, PUT: { requireAuth: true, requireFeatures: ['mfg_hr.manage'] }, DELETE: { requireAuth: true, requireFeatures: ['mfg_hr.manage'] } }
export const metadata = routeMetadata
const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: MfgWorkerEntity, idField: 'id', orgField: 'organization_id', tenantField: 'tenant_id', softDeleteField: 'deleted_at' },
  indexer: { entityType: 'mfg_hr:worker' },
  list: { schema: z.object({ page: z.coerce.number().min(1).default(1), pageSize: z.coerce.number().min(1).max(100).default(50), shift_type: z.string().optional(), work_center_id: z.string().uuid().optional() }).passthrough() },
  create: { schema: workerCreateSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: workerUpdateSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})
export const GET = crud.GET; export const POST = crud.POST; export const PUT = crud.PUT; export const DELETE = crud.DELETE
export const openApi = {}
