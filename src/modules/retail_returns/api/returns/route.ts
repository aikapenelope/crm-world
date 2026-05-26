import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { RetailReturnEntity } from '../../data/entities'
import { createReturnSchema, updateReturnSchema, listReturnSchema } from '../../data/validators'

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['retail_returns.view'] },
  POST: { requireAuth: true, requireFeatures: ['retail_returns.create'] },
  PUT: { requireAuth: true, requireFeatures: ['retail_returns.approve'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: RetailReturnEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
    // Entity is append-only (no deleted_at column). Disable the implicit
    // WHERE deletedAt IS NULL filter — see makeCrudRoute factory.ts:845.
    softDeleteField: null,
  },
  indexer: { entityType: 'retail_returns.return' },
  list: { schema: listReturnSchema },
  create: {
    schema: createReturnSchema,
    mapToEntity: (input: any) => {
      const subtotal = input.lines.reduce(
        (sum: number, l: any) => sum + l.quantity * Number(l.unit_price), 0
      )
      return {
        return_number: `DEV-${Date.now().toString(36).toUpperCase()}`,
        branch_id: input.branch_id,
        customer_id: input.customer_id ?? null,
        original_order_id: input.original_order_id ?? null,
        reason: input.reason,
        reason_detail: input.reason_detail ?? null,
        refund_method: input.refund_method,
        subtotal: subtotal.toFixed(2),
        restocking_fee: '0.00',
        refund_amount: subtotal.toFixed(2),
        notes: input.notes ?? null,
      }
    },
  },
  update: {
    schema: updateReturnSchema,
    applyToEntity: (entity: any, input: any) => {
      if (input.status) {
        entity.status = input.status
        if (input.status === 'completed') entity.processed_at = new Date()
      }
      if (input.processed_by) entity.processed_by = input.processed_by
      if (input.notes !== undefined) entity.notes = input.notes
    },
  },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT

export const openApi = {}
