import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { ContactPreferenceEntity } from '../../data/entities'
import { createPreferenceSchema, updatePreferenceSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  contact_id: z.string().uuid().optional(),
  is_active: z.coerce.boolean().optional(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['matching.view'] },
  POST: { requireAuth: true, requireFeatures: ['matching.manage_preferences'] },
  PUT: { requireAuth: true, requireFeatures: ['matching.manage_preferences'] },
  DELETE: { requireAuth: true, requireFeatures: ['matching.manage_preferences'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: ContactPreferenceEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
    softDeleteField: 'deleted_at',
  },
  list: { schema: listSchema },
  create: {
    schema: createPreferenceSchema,
    mapToEntity: (input: any) => ({ ...input }),
  },
  update: {
    schema: updatePreferenceSchema,
    applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) },
  },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT
export const DELETE = crud.DELETE

export const openApi = {}
