import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { CondoReceiptEntity } from '../../data/entities'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  building_id: z.string().uuid().optional(),
  fee_config_id: z.string().uuid().optional(),
  unit_id: z.string().uuid().optional(),
  status: z.string().optional(),
  period_month: z.string().optional(),
}).passthrough()

const updateSchema = z.object({
  status: z.enum(['pending', 'partial', 'paid', 'overdue', 'cancelled']).optional(),
  notes: z.string().max(500).optional().nullable(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['condo_fees.view'] },
  PUT: { requireAuth: true, requireFeatures: ['condo_fees.collect'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: CondoReceiptEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
  },
  indexer: { entityType: 'condo_fees.receipt' },
  list: { schema: listSchema },
  update: { schema: updateSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})

export const GET = crud.GET
export const PUT = crud.PUT

export const openApi = {}
