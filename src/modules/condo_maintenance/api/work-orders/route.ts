import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { CondoWorkOrderEntity } from '../../data/entities'
import { createWorkOrderSchema, updateWorkOrderSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  building_id: z.string().uuid().optional(),
  status: z.string().optional(),
  supplier_id: z.string().uuid().optional(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['condo_maintenance.view'] },
  POST: { requireAuth: true, requireFeatures: ['condo_maintenance.manage'] },
  PUT: { requireAuth: true, requireFeatures: ['condo_maintenance.manage'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: CondoWorkOrderEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
  },
  indexer: { entityType: 'condo_maintenance.work_order' },
  list: { schema: listSchema },
  create: { schema: createWorkOrderSchema, mapToEntity: (input: any) => ({ ...input, order_number: `OT-${Date.now().toString(36).toUpperCase().slice(-5)}` }) },
  update: { schema: updateWorkOrderSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input); if (input.status === 'completed') { entity.completed_at = new Date() } } },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT

export const openApi = {}
