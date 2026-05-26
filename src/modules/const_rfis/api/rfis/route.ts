import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { ConstRfiEntity } from '../../data/entities'
import { createRFISchema, updateRFISchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  project_id: z.string().uuid().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['const_rfis.view'] },
  POST: { requireAuth: true, requireFeatures: ['const_rfis.manage'] },
  PUT: { requireAuth: true, requireFeatures: ['const_rfis.manage'] },
  DELETE: { requireAuth: true, requireFeatures: ['const_rfis.manage'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: ConstRfiEntity, idField: 'id', orgField: 'organization_id',
      softDeleteField: null,, tenantField: 'tenant_id' },
  indexer: { entityType: 'const_rfis.rfi' },
  list: { schema: listSchema },
  create: { schema: createRFISchema, mapToEntity: (input: any) => ({ ...input, rfi_number: `RFI-${Date.now().toString(36).toUpperCase().slice(-5)}` }) },
  update: { schema: updateRFISchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT
export const DELETE = crud.DELETE
export const openApi = {}
