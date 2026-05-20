import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { RetailSupplierNoteEntity } from '../../data/entities'
import { createSupplierNoteSchema, listSupplierNotesSchema } from '../../data/validators'

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['retail_purchasing.view'] },
  POST: { requireAuth: true, requireFeatures: ['retail_purchasing.notes'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: RetailSupplierNoteEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
  },
  list: { schema: listSupplierNotesSchema },
  create: {
    schema: createSupplierNoteSchema,
    mapToEntity: (input: any) => ({
      note_number: `${input.type === 'debit' ? 'ND' : 'NC'}-${Date.now().toString(36).toUpperCase()}`,
      supplier_id: input.supplier_id,
      type: input.type,
      amount: input.amount,
      reason: input.reason ?? null,
      purchase_order_id: input.purchase_order_id ?? null,
      payable_id: input.payable_id ?? null,
    }),
  },
})

export const GET = crud.GET
export const POST = crud.POST

export const openApi = {}
