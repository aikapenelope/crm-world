import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { IspLeadEntity } from '../../data/entities'
import { createLeadSchema, updateLeadSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  search: z.string().optional(),
  status: z.string().optional(),
  source: z.string().optional(),
  assigned_agent_id: z.string().uuid().optional(),
  coverage_zone_id: z.string().uuid().optional(),
}).passthrough()

const routeMetadata = {
  GET:    { requireAuth: true, requireFeatures: ['isp_sales.view'] },
  POST:   { requireAuth: true, requireFeatures: ['isp_sales.create_leads'] },
  PUT:    { requireAuth: true, requireFeatures: ['isp_sales.manage_leads'] },
  DELETE: { requireAuth: true, requireFeatures: ['isp_sales.manage_leads'] },
}
export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: IspLeadEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
    softDeleteField: 'deleted_at',
  },
  indexer: { entityType: 'isp_sales.lead' },
  list: { schema: listSchema },
  create: { schema: createLeadSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: updateLeadSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT
export const DELETE = crud.DELETE
export const openApi = {}
