import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { ConstSubcontractPaymentEntity } from '../../data/entities'
import { createPaymentSchema, updatePaymentSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  subcontract_id: z.string().uuid().optional(),
  status: z.string().optional(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['const_subcon.view'] },
  POST: { requireAuth: true, requireFeatures: ['const_subcon.manage'] },
  PUT: { requireAuth: true, requireFeatures: ['const_subcon.payments'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: { entity: ConstSubcontractPaymentEntity, idField: 'id', orgField: null as any, tenantField: null as any, softDeleteField: null },
  indexer: { entityType: 'const_subcon.payment' },
  list: { schema: listSchema },
  create: { schema: createPaymentSchema, mapToEntity: (input: any) => ({ ...input, payment_number: `PAG-${Date.now().toString(36).toUpperCase().slice(-5)}` }) },
  update: { schema: updatePaymentSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT
export const openApi = {}
