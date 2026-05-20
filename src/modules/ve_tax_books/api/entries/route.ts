import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { VeTaxBookEntryEntity } from '../../data/entities'
import { createEntrySchema, updateEntrySchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  search: z.string().optional(),
  book_type: z.enum(['sales', 'purchases']).optional(),
  period_month: z.string().optional(),
  document_type: z.string().optional(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['ve_tax_books.view'] },
  POST: { requireAuth: true, requireFeatures: ['ve_tax_books.create'] },
  PUT: { requireAuth: true, requireFeatures: ['ve_tax_books.edit'] },
  DELETE: { requireAuth: true, requireFeatures: ['ve_tax_books.delete'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: VeTaxBookEntryEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
    softDeleteField: 'deleted_at',
  },
  indexer: { entityType: 've_tax_books.entry' },
  list: { schema: listSchema },
  create: { schema: createEntrySchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: updateEntrySchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT
export const DELETE = crud.DELETE

export const openApi = {}
