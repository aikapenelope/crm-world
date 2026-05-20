import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { CondoSupplierEntity } from '../../data/entities'
import { createSupplierSchema, updateSupplierSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  specialty: z.string().optional(),
  is_active: z.string().optional(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['condo_maintenance.view'] },
  POST: { requireAuth: true, requireFeatures: ['condo_maintenance.suppliers'] },
  PUT: { requireAuth: true, requireFeatures: ['condo_maintenance.suppliers'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: CondoSupplierEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
  },
  indexer: { entityType: 'condo_maintenance.supplier' },
  list: { schema: listSchema },
  create: { schema: createSupplierSchema, mapToEntity: (input: any) => ({ ...input }) },
  update: { schema: updateSupplierSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT

export const openApi = {}
