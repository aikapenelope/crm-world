import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { ConstSubmittalEntity } from '../../data/entities'
import { createSubmittalSchema, updateSubmittalSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  project_id: z.string().uuid().optional(),
  status: z.string().optional(),
  submittal_type: z.string().optional(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['const_rfis.view'] },
  POST: { requireAuth: true, requireFeatures: ['const_rfis.manage'] },
  PUT: { requireAuth: true, requireFeatures: ['const_rfis.manage'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: ConstSubmittalEntity, idField: 'id', orgField: 'organization_id',
      softDeleteField: null,, tenantField: 'tenant_id' },
  indexer: { entityType: 'const_rfis.submittal' },
  list: { schema: listSchema },
  create: { schema: createSubmittalSchema, mapToEntity: (input: any) => ({ ...input, submittal_number: `SUB-${Date.now().toString(36).toUpperCase().slice(-5)}` }) },
  update: { schema: updateSubmittalSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT
export const openApi = {}
