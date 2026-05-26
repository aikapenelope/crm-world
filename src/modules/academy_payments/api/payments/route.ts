import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { AcademyPaymentEntity } from '../../data/entities'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(200).default(100),
  enrollment_id: z.string().uuid().optional(),
  status: z.string().optional(),
}).passthrough()

const createSchema = z.object({
  enrollment_id: z.string().uuid(),
  amount: z.coerce.number().min(0),
  currency: z.string().max(10).default('USD'),
  exchange_rate: z.coerce.number().optional().nullable(),
  amount_ves: z.coerce.number().optional().nullable(),
  payment_method: z.string().min(1).max(50),
  reference: z.string().max(100).optional().nullable(),
  payment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(['pending', 'confirmed', 'cancelled']).default('confirmed'),
  notes: z.string().max(1000).optional().nullable(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['academy_payments.view'] },
  POST: { requireAuth: true, requireFeatures: ['academy_payments.manage'] },
  PUT: { requireAuth: true, requireFeatures: ['academy_payments.manage'] },
  DELETE: { requireAuth: true, requireFeatures: ['academy_payments.manage'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: AcademyPaymentEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
    // Entity is append-only (no deleted_at column). Disable the implicit
    // WHERE deletedAt IS NULL filter — see makeCrudRoute factory.ts:845.
    softDeleteField: null,
  },
  indexer: { entityType: 'academy_payments.payment' },
  list: { schema: listSchema },
  create: {
    schema: createSchema,
    mapToEntity: (input: any) => ({
      ...input,
      payment_number: `PAY-${Date.now().toString(36).toUpperCase().slice(-6)}`,
      amount: String(input.amount),
    }),
  },
  update: {
    schema: createSchema.partial(),
    applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) },
  },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT
export const DELETE = crud.DELETE
export const openApi = {}
