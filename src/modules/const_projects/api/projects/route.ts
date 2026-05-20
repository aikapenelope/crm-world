import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { ConstProjectEntity } from '../../data/entities'
import { createProjectSchema, updateProjectSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  search: z.string().optional(),
  status: z.string().optional(),
  project_type: z.string().optional(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['const_projects.view'] },
  POST: { requireAuth: true, requireFeatures: ['const_projects.manage'] },
  PUT: { requireAuth: true, requireFeatures: ['const_projects.manage'] },
  DELETE: { requireAuth: true, requireFeatures: ['const_projects.manage'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: ConstProjectEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
    softDeleteField: 'deleted_at',
  },
  indexer: { entityType: 'const_projects.project' },
  list: { schema: listSchema },
  create: { schema: createProjectSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: updateProjectSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT
export const DELETE = crud.DELETE

export const openApi = {}
