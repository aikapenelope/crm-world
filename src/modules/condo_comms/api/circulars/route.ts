import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { CondoCircularEntity } from '../../data/entities'
import { createCircularSchema, updateCircularSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  building_id: z.string().uuid().optional(),
  category: z.string().optional(),
  status: z.string().optional(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['condo_comms.view'] },
  POST: { requireAuth: true, requireFeatures: ['condo_comms.manage'] },
  PUT: { requireAuth: true, requireFeatures: ['condo_comms.manage'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: CondoCircularEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
  },
  indexer: { entityType: 'condo_comms.circular' },
  list: { schema: listSchema },
  create: { schema: createCircularSchema, mapToEntity: (input: any) => ({ ...input, circular_number: `CIRC-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase().slice(-4)}` }) },
  update: { schema: updateCircularSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT

export const openApi = {}
