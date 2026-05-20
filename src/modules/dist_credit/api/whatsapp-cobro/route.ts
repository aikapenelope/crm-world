import { NextResponse } from 'next/server'
import { z } from 'zod'

/**
 * GET /api/dist-credit/whatsapp-cobro
 *
 * Returns a list of customers with overdue balances and pre-formatted
 * WhatsApp messages for collection. Adapted from tuition/whatsapp-cobro.
 */

const querySchema = z.object({
  min_days_overdue: z.coerce.number().min(0).default(1),
})

export const metadata = {
  GET: { requireAuth: true, requireFeatures: ['dist_credit.cobro'] },
}

export async function GET(request: Request, ctx: any) {
  try {
    const url = new URL(request.url)
    const params = querySchema.parse({
      min_days_overdue: url.searchParams.get('min_days_overdue') ?? '1',
    })

    const scope = ctx.scope as { tenantId: string; organizationId: string }
    if (!scope) return NextResponse.json({ error: 'No scope' }, { status: 401 })

    const em = ctx.container.resolve('em')
    const kysely = (em as any).getKysely()

    // Get organization name for message
    const org = await kysely
      .selectFrom('organizations')
      .select(['name'])
      .where('id', '=', scope.organizationId)
      .executeTakeFirst()

    const companyName = (org as any)?.name ?? 'la empresa'

    // Get customers with positive balance (they owe money)
    const limits = await kysely
      .selectFrom('dist_credit_limits')
      .selectAll()
      .where('tenant_id', '=', scope.tenantId)
      .where('organization_id', '=', scope.organizationId)
      .where('deleted_at', 'is', null)
      .execute()

    const customersWithDebt = (limits as any[]).filter((l: any) => Number(l.current_balance) > 0)

    if (customersWithDebt.length === 0) {
      return NextResponse.json({ items: [], total: 0 })
    }

    // Get customer contact info
    const customerIds = customersWithDebt.map((l: any) => l.customer_id)
    const customers = await kysely
      .selectFrom('customer_people')
      .select(['id', 'display_name', 'primary_phone', 'primary_email'])
      .where('id', 'in', customerIds)
      .execute()

    const customerMap = new Map<string, any>(customers.map((c: any) => [c.id, c]))

    // Get overdue invoices per customer
    const now = new Date()
    const overdueInvoices = await kysely
      .selectFrom('dist_credit_transactions')
      .selectAll()
      .where('tenant_id', '=', scope.tenantId)
      .where('organization_id', '=', scope.organizationId)
      .where('type', '=', 'invoice')
      .where('due_date', '<', now.toISOString().split('T')[0])
      .where('customer_id', 'in', customerIds)
      .orderBy('due_date', 'asc')
      .execute()

    // Group invoices by customer
    const invoicesByCustomer = new Map<string, any[]>()
    for (const inv of overdueInvoices as any[]) {
      const list = invoicesByCustomer.get(inv.customer_id) ?? []
      list.push(inv)
      invoicesByCustomer.set(inv.customer_id, list)
    }

    // Build response items with wa.me links
    const items = customersWithDebt.map((limit: any) => {
      const customer = customerMap.get(limit.customer_id) as any
      const invoices = invoicesByCustomer.get(limit.customer_id) ?? []

      const customerName = customer?.display_name ?? 'Cliente'
      const phone = customer?.primary_phone ?? null
      const balance = Number(limit.current_balance)

      // Calculate days overdue (oldest invoice)
      const oldestDueDate = invoices.length > 0 ? new Date(invoices[0].due_date) : null
      const daysOverdue = oldestDueDate
        ? Math.floor((now.getTime() - oldestDueDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0

      if (daysOverdue < params.min_days_overdue) return null

      // Build WhatsApp message
      const message = buildCobroMessage({
        companyName,
        customerName,
        balance: balance.toLocaleString('es-VE', { minimumFractionDigits: 2 }),
        currency: limit.currency,
        invoiceCount: invoices.length,
        oldestDueDate: oldestDueDate ? oldestDueDate.toLocaleDateString('es-VE') : null,
        daysOverdue,
      })

      // Build wa.me link
      const cleanPhone = phone ? phone.replace(/[^0-9+]/g, '').replace(/^\+/, '') : null
      const waLink = cleanPhone
        ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
        : null

      return {
        customerId: limit.customer_id,
        customerName,
        phone,
        balance: limit.current_balance,
        currency: limit.currency,
        creditLimit: limit.credit_limit,
        invoiceCount: invoices.length,
        daysOverdue,
        oldestDueDate: oldestDueDate?.toISOString().split('T')[0] ?? null,
        status: limit.status,
        message,
        waLink,
      }
    }).filter(Boolean)

    return NextResponse.json({
      items,
      total: items.length,
      withPhone: items.filter((i: any) => i.waLink).length,
      withoutPhone: items.filter((i: any) => !i.waLink).length,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// =============================================================================
// Message Builder
// =============================================================================

type CobroMessageParams = {
  companyName: string
  customerName: string
  balance: string
  currency: string
  invoiceCount: number
  oldestDueDate: string | null
  daysOverdue: number
}

function buildCobroMessage(params: CobroMessageParams): string {
  const greeting = `Estimado/a ${params.customerName},`
  const urgency = params.daysOverdue > 60
    ? 'Le informamos que su cuenta presenta un *saldo vencido importante*:'
    : params.daysOverdue > 30
      ? 'Le recordamos que tiene *facturas vencidas* pendientes de pago:'
      : 'Le recordamos el siguiente saldo pendiente:'

  const invoiceLine = params.invoiceCount > 1
    ? `*Facturas pendientes:* ${params.invoiceCount}`
    : '*Factura pendiente:* 1'

  const dueLine = params.oldestDueDate
    ? `*Vencida desde:* ${params.oldestDueDate} (${params.daysOverdue} días)`
    : ''

  return `${greeting}

${urgency}

*Saldo pendiente:* ${params.currency} ${params.balance}
${invoiceLine}
${dueLine}

Puede realizar su pago por: Pago Móvil, Zelle, Binance, Transferencia o Efectivo.

Una vez realizado, por favor envíe el comprobante por este medio para acreditar su cuenta.

Gracias,
_${params.companyName}_`
}

export const openApi = {}
