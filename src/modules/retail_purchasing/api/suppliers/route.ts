import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { RetailSupplierEntity } from '../../data/entities'
import { createSupplierSchema, updateSupplierSchema, listSuppliersSchema } from '../../data/validators'

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['retail_purchasing.view'] },
  POST: { requireAuth: true, requireFeatures: ['retail_purchasing.suppliers'] },
  PUT: { requireAuth: true, requireFeatures: ['retail_purchasing.suppliers'] },
  DELETE: { requireAuth: true, requireFeatures: ['retail_purchasing.suppliers'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: RetailSupplierEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
    softDeleteField: 'deleted_at',
  },
  list: { schema: listSuppliersSchema },
  create: {
    schema: createSupplierSchema,
    mapToEntity: (input: any) => ({ ...input }),
  },
  update: {
    schema: updateSupplierSchema,
    applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) },
  },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT
export const DELETE = crud.DELETE

export const openApi = {}
