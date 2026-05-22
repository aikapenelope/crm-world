import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { IspSupportTicketEntity } from '../../data/entities'
import { createTicketSchema, updateTicketSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  search: z.string().optional(),
  status: z.string().optional(),
  type: z.string().optional(),
  priority: z.string().optional(),
  subscriber_id: z.string().uuid().optional(),
  node_id: z.string().uuid().optional(),
  assigned_to: z.string().uuid().optional(),
  outage_id: z.string().uuid().optional(),
}).passthrough()

const routeMetadata = {
  GET:    { requireAuth: true, requireFeatures: ['isp_support.view'] },
  POST:   { requireAuth: true, requireFeatures: ['isp_support.create'] },
  PUT:    { requireAuth: true, requireFeatures: ['isp_support.manage'] },
  DELETE: { requireAuth: true, requireFeatures: ['isp_support.manage'] },
}
export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: IspSupportTicketEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
    softDeleteField: undefined,
  },
  indexer: { entityType: 'isp_support.ticket' },
  list: { schema: listSchema },
  create: { schema: createTicketSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: updateTicketSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT
export const DELETE = crud.DELETE
export const openApi = {}
