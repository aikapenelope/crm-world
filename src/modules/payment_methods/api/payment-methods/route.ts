import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { PaymentMethodEntity } from '../../data/entities'
import { createPaymentMethodSchema, updatePaymentMethodSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['payment_methods.view'] },
  POST: { requireAuth: true, requireFeatures: ['payment_methods.create'] },
  PUT: { requireAuth: true, requireFeatures: ['payment_methods.edit'] },
  DELETE: { requireAuth: true, requireFeatures: ['payment_methods.delete'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: PaymentMethodEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
    softDeleteField: 'deleted_at',
  },
  list: { schema: listSchema },
  create: {
    schema: createPaymentMethodSchema,
    mapToEntity: (input: any) => ({ ...input }),
  },
  update: {
    schema: updatePaymentMethodSchema,
    applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) },
  },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT
export const DELETE = crud.DELETE

export const openApi = {}
