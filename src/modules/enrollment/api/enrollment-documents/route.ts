import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { EnrollmentDocumentEntity } from '../../data/entities'
import { createDocumentSchema, updateDocumentSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  application_id: z.string().uuid().optional(),
  status: z.string().optional(),
  document_type: z.string().optional(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['enrollment.view'] },
  POST: { requireAuth: true, requireFeatures: ['enrollment.manage_documents'] },
  PUT: { requireAuth: true, requireFeatures: ['enrollment.manage_documents'] },
  DELETE: { requireAuth: true, requireFeatures: ['enrollment.manage_documents'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: EnrollmentDocumentEntity,
    idField: 'id',
    orgField: 'tenant_id',
    tenantField: 'tenant_id',
  },
  indexer: { entityType: 'enrollment.document' },
  list: { schema: listSchema },
  create: {
    schema: createDocumentSchema,
    mapToEntity: (input: any) => ({ ...input }),
  },
  update: {
    schema: updateDocumentSchema,
    applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) },
  },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT
export const DELETE = crud.DELETE

export const openApi = {}
