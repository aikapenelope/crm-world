import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { ConstSubcontractEntity } from '../../data/entities'
import { createSubcontractSchema, updateSubcontractSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  project_id: z.string().uuid().optional(),
  status: z.string().optional(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['const_subcon.view'] },
  POST: { requireAuth: true, requireFeatures: ['const_subcon.manage'] },
  PUT: { requireAuth: true, requireFeatures: ['const_subcon.manage'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: ConstSubcontractEntity, idField: 'id', orgField: 'organization_id', tenantField: 'tenant_id', softDeleteField: null },
  indexer: { entityType: 'const_subcon.contract' },
  list: { schema: listSchema },
  create: { schema: createSubcontractSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: updateSubcontractSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT
export const openApi = {}
