import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { RetailCreditNoteEntity } from '../../data/entities'
import { listCreditNotesSchema } from '../../data/validators'

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['retail_returns.view'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: RetailCreditNoteEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
    // Entity is append-only (no deleted_at column). Disable the implicit
    // WHERE deletedAt IS NULL filter — see makeCrudRoute factory.ts:845.
    softDeleteField: null,
  },
  indexer: { entityType: 'retail_returns.credit_note' },
  list: { schema: listCreditNotesSchema },
})

export const GET = crud.GET

export const openApi = {}
