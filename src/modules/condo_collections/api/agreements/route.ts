import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { CondoPaymentAgreementEntity } from '../../data/entities'
import { createAgreementSchema, updateAgreementSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  unit_id: z.string().uuid().optional(),
  status: z.string().optional(),
}).passthrough()

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['condo_collections.view'] },
  POST: { requireAuth: true, requireFeatures: ['condo_collections.agreements'] },
  PUT: { requireAuth: true, requireFeatures: ['condo_collections.agreements'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: CondoPaymentAgreementEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
    // Entity is append-only (no deleted_at column). Disable the implicit
    // WHERE deletedAt IS NULL filter — see makeCrudRoute factory.ts:845.
    softDeleteField: null,
  },
  indexer: { entityType: 'condo_collections.agreement' },
  list: { schema: listSchema },
  create: { schema: createAgreementSchema, mapToEntity: (input: any) => ({ ...input, status: 'active', agreement_number: `ACU-${Date.now().toString(36).toUpperCase()}` }) },
  update: { schema: updateAgreementSchema, applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) } },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT

export const openApi = {}
