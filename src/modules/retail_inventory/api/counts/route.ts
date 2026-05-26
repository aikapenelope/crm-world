import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { RetailStockCountEntity } from '../../data/entities'
import { createCountSchema, updateCountSchema, listCountSchema } from '../../data/validators'

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['retail_inventory.view'] },
  POST: { requireAuth: true, requireFeatures: ['retail_inventory.count'] },
  PUT: { requireAuth: true, requireFeatures: ['retail_inventory.count'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: RetailStockCountEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
    // Entity is append-only (no deleted_at column). Disable the implicit
    // WHERE deletedAt IS NULL filter — see makeCrudRoute factory.ts:845.
    softDeleteField: null,
  },
  indexer: { entityType: 'retail_inventory.count' },
  list: { schema: listCountSchema },
  create: {
    schema: createCountSchema,
    mapToEntity: (input: any) => ({
      branch_id: input.branch_id,
      count_number: `CNT-${Date.now().toString(36).toUpperCase()}`,
      count_type: input.count_type,
      planned_date: new Date(input.planned_date),
      notes: input.notes ?? null,
    }),
  },
  update: {
    schema: updateCountSchema,
    applyToEntity: (entity: any, input: any) => {
      if (input.status) {
        entity.status = input.status
        if (input.status === 'in_progress') entity.started_at = new Date()
        if (input.status === 'completed') entity.completed_at = new Date()
      }
      if (input.performed_by) entity.performed_by = input.performed_by
      if (input.approved_by) entity.approved_by = input.approved_by
      if (input.notes !== undefined) entity.notes = input.notes
    },
  },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT

export const openApi = {}
