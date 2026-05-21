import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { RetailPurchaseOrderEntity } from '../../data/entities'
import { createPurchaseOrderSchema, updatePurchaseOrderSchema, listPurchaseOrdersSchema } from '../../data/validators'

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['retail_purchasing.view'] },
  POST: { requireAuth: true, requireFeatures: ['retail_purchasing.create'] },
  PUT: { requireAuth: true, requireFeatures: ['retail_purchasing.receive'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: RetailPurchaseOrderEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
  },
  indexer: { entityType: 'retail_purchasing.order' },
  list: { schema: listPurchaseOrdersSchema },
  create: {
    schema: createPurchaseOrderSchema,
    mapToEntity: (input: any) => {
      const lines = input.lines ?? []
      const subtotal = lines.reduce((sum: number, l: any) => sum + l.quantity_ordered * Number(l.unit_cost), 0)
      const taxAmount = subtotal * 0.16
      return {
        order_number: `OC-${Date.now().toString(36).toUpperCase()}`,
        supplier_id: input.supplier_id,
        currency: input.currency,
        exchange_rate: input.exchange_rate ?? null,
        expected_delivery_date: input.expected_delivery_date ? new Date(input.expected_delivery_date) : null,
        branch_id: input.branch_id ?? null,
        subtotal: subtotal.toFixed(2),
        tax_amount: taxAmount.toFixed(2),
        total: (subtotal + taxAmount).toFixed(2),
        notes: input.notes ?? null,
      }
    },
  },
  update: {
    schema: updatePurchaseOrderSchema,
    applyToEntity: (entity: any, input: any) => {
      if (input.status) {
        entity.status = input.status
        if (input.status === 'sent') entity.sent_at = new Date()
        if (input.status === 'received') entity.received_at = new Date()
      }
      if (input.notes !== undefined) entity.notes = input.notes
    },
  },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT

export const openApi = {}
