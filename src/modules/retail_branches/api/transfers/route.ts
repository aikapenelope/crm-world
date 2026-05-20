import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { RetailTransferEntity } from '../../data/entities'
import { createTransferSchema, updateTransferSchema, listTransferSchema } from '../../data/validators'

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['retail_branches.view'] },
  POST: { requireAuth: true, requireFeatures: ['retail_branches.transfer'] },
  PUT: { requireAuth: true, requireFeatures: ['retail_branches.transfer'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: RetailTransferEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
  },
  list: { schema: listTransferSchema },
  create: {
    schema: createTransferSchema,
    mapToEntity: (input: any) => ({
      transfer_number: `TRF-${Date.now().toString(36).toUpperCase()}`,
      from_branch_id: input.from_branch_id,
      to_branch_id: input.to_branch_id,
      requested_by: input.requested_by ?? '',
      notes: input.notes ?? null,
    }),
  },
  update: {
    schema: updateTransferSchema,
    applyToEntity: (entity: any, input: any) => {
      if (input.status) entity.status = input.status
      if (input.approved_by) {
        entity.approved_by = input.approved_by
        entity.approved_at = new Date()
      }
      if (input.status === 'in_transit') entity.shipped_at = new Date()
      if (input.status === 'received') entity.received_at = new Date()
      if (input.notes !== undefined) entity.notes = input.notes
    },
  },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT

export const openApi = {}
