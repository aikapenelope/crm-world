import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { IspTicketCommentEntity } from '../../data/entities'
import { addCommentSchema } from '../../data/validators'
import { z } from 'zod'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  ticket_id: z.string().uuid().optional(),
}).passthrough()

const routeMetadata = {
  GET:  { requireAuth: true, requireFeatures: ['isp_support.view'] },
  POST: { requireAuth: true, requireFeatures: ['isp_support.manage'] },
}
export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: IspTicketCommentEntity,
    idField: 'id',
    orgField: undefined,
    tenantField: 'tenant_id',
    softDeleteField: undefined,
  },
  indexer: { entityType: 'isp_support.ticket_comment' },
  list: { schema: listSchema },
  create: { schema: addCommentSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: addCommentSchema.partial(), applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})

export const GET = crud.GET
export const POST = crud.POST
export const openApi = {}
