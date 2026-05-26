import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { ConstTaskEntity } from '../../data/entities'
import { createTaskSchema, updateTaskSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(500).default(200),
  project_id: z.string().uuid().optional(),
  status: z.string().optional(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['const_schedule.view'] },
  POST: { requireAuth: true, requireFeatures: ['const_schedule.manage'] },
  PUT: { requireAuth: true, requireFeatures: ['const_schedule.manage'] },
  DELETE: { requireAuth: true, requireFeatures: ['const_schedule.manage'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: ConstTaskEntity, idField: 'id', orgField: 'organization_id',
      softDeleteField: null,, tenantField: 'tenant_id' },
  indexer: { entityType: 'const_schedule.task' },
  list: { schema: listSchema },
  create: { schema: createTaskSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: updateTaskSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT
export const DELETE = crud.DELETE
export const openApi = {}
