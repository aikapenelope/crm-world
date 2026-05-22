import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { IspFieldTechnicianEntity } from '../../data/entities'
import { createTechnicianSchema, updateTechnicianSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(100),
  search: z.string().optional(),
  status: z.string().optional(),
  coverage_zone: z.string().optional(),
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
    entity: IspFieldTechnicianEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
    softDeleteField: 'deleted_at',
  },
  indexer: { entityType: 'isp_technicians.technician' },
  list: { schema: listSchema },
  create: { schema: createTechnicianSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: updateTechnicianSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT
export const DELETE = crud.DELETE
export const openApi = {}
