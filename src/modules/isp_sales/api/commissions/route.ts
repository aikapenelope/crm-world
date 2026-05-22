import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { IspCommissionEntity } from '../../data/entities'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  agent_id: z.string().uuid().optional(),
  status: z.string().optional(),
  commission_type: z.string().optional(),
}).passthrough()

const bodySchema = z.object({
  agent_id: z.string().uuid(),
  subscriber_id: z.string().uuid(),
  commission_type: z.enum(['installation', 'retention_3m', 'retention_6m', 'upgrade']),
  amount_usd: z.string().regex(/^\d+(\.\d{1,2})?$/),
  period_month: z.string().regex(/^\d{4}-\d{2}$/).nullable().optional(),
  notes: z.string().nullable().optional(),
})

const routeMetadata = {
  GET:    { requireAuth: true, requireFeatures: ['isp_sales.view_commissions'] },
  POST:   { requireAuth: true, requireFeatures: ['isp_sales.approve_commissions'] },
  PUT:    { requireAuth: true, requireFeatures: ['isp_sales.approve_commissions'] },
}
export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: IspCommissionEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
    softDeleteField: undefined,
  },
  indexer: { entityType: 'isp_sales.commission' },
  list: { schema: listSchema },
  create: { schema: bodySchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: bodySchema.partial(), applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT
export const openApi = {}
