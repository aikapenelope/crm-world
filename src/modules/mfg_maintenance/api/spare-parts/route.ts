import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { MfgSparePartEntity } from '../../data/entities'
import { sparePartCreateSchema, sparePartUpdateSchema } from '../../data/validators'
const routeMetadata = { GET: { requireAuth: true, requireFeatures: ['mfg_maintenance.view'] }, POST: { requireAuth: true, requireFeatures: ['mfg_maintenance.config'] }, PUT: { requireAuth: true, requireFeatures: ['mfg_maintenance.config'] }, DELETE: { requireAuth: true, requireFeatures: ['mfg_maintenance.config'] } }
export const metadata = routeMetadata
const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: MfgSparePartEntity, idField: 'id', orgField: 'organization_id', tenantField: 'tenant_id', softDeleteField: 'deleted_at' },
  indexer: { entityType: 'mfg_maintenance:spare_part' },
  list: { schema: z.object({ page: z.coerce.number().min(1).default(1), pageSize: z.coerce.number().min(1).max(200).default(100), is_imported: z.coerce.boolean().optional() }).passthrough() },
  create: { schema: sparePartCreateSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: sparePartUpdateSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})
export const GET = crud.GET; export const POST = crud.POST; export const PUT = crud.PUT; export const DELETE = crud.DELETE
export const openApi = {}
