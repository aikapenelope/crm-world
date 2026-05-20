import { listPayablesSchema, registerPaymentSchema } from '../../data/validators'

const routeMetadata = {
  GET: { requireAuth: true, requireFeatures: ['retail_purchasing.payables'] },
  POST: { requireAuth: true, requireFeatures: ['retail_purchasing.payables'] },
}

export const metadata = routeMetadata

export async function GET(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()
  const url = new URL(request.url)
  const params = listPayablesSchema.parse(Object.fromEntries(url.searchParams))

  let query = kysely
    .selectFrom('retail_accounts_payable')
    .where('tenant_id', '=', scope.tenantId)
    .where('organization_id', '=', scope.organizationId)

  if (params.status) query = query.where('status', '=', params.status)
  if (params.supplier_id) query = query.where('supplier_id', '=', params.supplier_id)

  const items = await query
    .selectAll()
    .orderBy('due_date', 'asc')
    .limit(params.pageSize)
    .offset((params.page - 1) * params.pageSize)
    .execute()

  return Response.json({ items })
}

export async function POST(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()
  const body = await request.json()
  const input = registerPaymentSchema.parse(body)

  const payable = await kysely
    .selectFrom('retail_accounts_payable')
    .where('id', '=', input.payable_id)
    .where('tenant_id', '=', scope.tenantId)
    .selectAll()
    .executeTakeFirst()

  if (!payable) {
    return Response.json({ error: 'Payable not found' }, { status: 404 })
  }

  const newAmountPaid = Number((payable as any).amount_paid) + Number(input.amount)
  const totalAmount = Number((payable as any).amount)
  const newBalance = totalAmount - newAmountPaid
  const newStatus = newBalance <= 0 ? 'paid' : 'partially_paid'

  await kysely
    .updateTable('retail_accounts_payable')
    .set({
      amount_paid: newAmountPaid.toFixed(2),
      balance: Math.max(0, newBalance).toFixed(2),
      status: newStatus,
      paid_at: newStatus === 'paid' ? new Date() : null,
      updated_at: new Date(),
    } as any)
    .where('id', '=', input.payable_id)
    .execute()

  return Response.json({ status: newStatus, balance: Math.max(0, newBalance).toFixed(2) })
}

export const openApi = {}
