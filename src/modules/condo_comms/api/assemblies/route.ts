import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { CondoAssemblyEntity } from '../../data/entities'
import { createAssemblySchema, updateAssemblySchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  building_id: z.string().uuid().optional(),
  status: z.string().optional(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['condo_comms.view'] },
  POST: { requireAuth: true, requireFeatures: ['condo_comms.assemblies'] },
  PUT: { requireAuth: true, requireFeatures: ['condo_comms.assemblies'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: CondoAssemblyEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
  },
  indexer: { entityType: 'condo_comms.assembly' },
  list: { schema: listSchema },
  create: { schema: createAssemblySchema, mapToEntity: (input: any) => ({ ...input, assembly_number: `ASA-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase().slice(-4)}` }) },
  update: { schema: updateAssemblySchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT

export const openApi = {}
