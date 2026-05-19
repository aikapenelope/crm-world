import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { PaymentRecordEntity } from '../../data/entities'
import { recordPaymentSchema, updatePaymentRecordSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  search: z.string().optional(),
  status: z.enum(['pending', 'confirmed', 'rejected', 'cancelled']).optional(),
  payment_method_code: z.string().optional(),
  reference_type: z.string().optional(),
  reference_id: z.string().uuid().optional(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['payment_methods.view'] },
  POST: { requireAuth: true, requireFeatures: ['payment_methods.record_payment'] },
  PUT: { requireAuth: true, requireFeatures: ['payment_methods.record_payment'] },
  DELETE: { requireAuth: true, requireFeatures: ['payment_methods.delete'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: PaymentRecordEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
    softDeleteField: 'deleted_at',
  },
  list: { schema: listSchema },
  create: {
    schema: recordPaymentSchema,
    mapToEntity: (input: any) => ({ ...input }),
  },
  update: {
    schema: updatePaymentRecordSchema,
    applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) },
  },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT
export const DELETE = crud.DELETE

export const openApi = {}
