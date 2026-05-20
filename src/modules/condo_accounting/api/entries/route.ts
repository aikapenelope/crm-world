import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { CondoAccountingEntryEntity } from '../../data/entities'
import { createEntrySchema, updateEntrySchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  building_id: z.string().uuid().optional(),
  entry_type: z.string().optional(),
  category: z.string().optional(),
  period_month: z.string().optional(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['condo_accounting.view'] },
  POST: { requireAuth: true, requireFeatures: ['condo_accounting.manage'] },
  PUT: { requireAuth: true, requireFeatures: ['condo_accounting.manage'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: CondoAccountingEntryEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
  },
  indexer: { entityType: 'condo_accounting.entry' },
  list: { schema: listSchema },
  create: { schema: createEntrySchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: updateEntrySchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT

export const openApi = {}
