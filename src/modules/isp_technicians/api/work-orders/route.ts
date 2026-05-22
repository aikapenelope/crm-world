import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { IspWorkOrderEntity } from '../../data/entities'
import { createWorkOrderSchema, updateWorkOrderSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  status: z.string().optional(),
  type: z.string().optional(),
  technician_id: z.string().uuid().optional(),
  subscriber_id: z.string().uuid().optional(),
  scheduled_date: z.string().optional(),
}).passthrough()

const routeMetadata = {
  GET:    { requireAuth: true, requireFeatures: ['isp_technicians.view'] },
  POST:   { requireAuth: true, requireFeatures: ['isp_technicians.manage'] },
  PUT:    { requireAuth: true, requireFeatures: ['isp_technicians.manage'] },
  DELETE: { requireAuth: true, requireFeatures: ['isp_technicians.manage'] },
}
export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: IspWorkOrderEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
    softDeleteField: undefined,
  },
  indexer: { entityType: 'isp_technicians.work_order' },
  list: { schema: listSchema },
  create: { schema: createWorkOrderSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: updateWorkOrderSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT
export const DELETE = crud.DELETE
export const openApi = {}
