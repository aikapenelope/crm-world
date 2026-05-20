import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { RetailOnlineOrderEntity } from '../../data/entities'
import { createOnlineOrderSchema, updateOnlineOrderSchema, listOnlineOrdersSchema } from '../../data/validators'

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['retail_ecommerce.view'] },
  POST: { requireAuth: false },
  PUT: { requireAuth: true, requireFeatures: ['retail_ecommerce.manage'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: RetailOnlineOrderEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
  },
  list: { schema: listOnlineOrdersSchema },
  create: {
    schema: createOnlineOrderSchema,
    mapToEntity: (input: any) => {
      const subtotal = input.lines.reduce(
        (sum: number, l: any) => sum + l.quantity * Number(l.unit_price), 0
      )
      const taxAmount = subtotal * 0.16 // IVA 16%
      const total = subtotal + taxAmount

      return {
        order_number: `WEB-${Date.now().toString(36).toUpperCase()}`,
        customer_id: input.customer_id ?? null,
        guest_name: input.guest_name ?? null,
        guest_phone: input.guest_phone ?? null,
        guest_email: input.guest_email ?? null,
        delivery_type: input.delivery_type,
        delivery_address: input.delivery_address ?? null,
        subtotal: subtotal.toFixed(2),
        tax_amount: taxAmount.toFixed(2),
        total: total.toFixed(2),
        payment_method: input.payment_method ?? null,
        notes: input.notes ?? null,
        source: input.source,
      }
    },
  },
  update: {
    schema: updateOnlineOrderSchema,
    applyToEntity: (entity: any, input: any) => {
      if (input.status) {
        entity.status = input.status
        if (input.status === 'delivered') entity.delivered_at = new Date()
      }
      if (input.payment_status) entity.payment_status = input.payment_status
      if (input.payment_reference) entity.payment_reference = input.payment_reference
      if (input.notes !== undefined) entity.notes = input.notes
    },
  },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT

export const openApi = {}
