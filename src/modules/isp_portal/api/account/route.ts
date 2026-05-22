/**
 * GET /api/isp-portal/account
 *
 * Estado de cuenta del abonado autenticado.
 *
 * Resolución de identidad:
 *   ctx.customerContext.customerEntityId  → FK al CRM del tenant
 *   (claim del JWT firmado por customerSessionService)
 *   Source: packages/core/src/modules/customer_accounts/services/customerSessionService.ts
 *
 * El operador vincula el abonado al CustomerUser en customer_accounts/admin/users
 * seteando customerEntityId. Al activarse la sesión del portal, el JWT ya lleva
 * ese campo y permite localizar el abonado directamente.
 */
export const metadata = {
  GET: { requireCustomerAuth: true, requireCustomerFeatures: ['isp_portal.view_account'] },
}

export async function GET(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()

  // El customer context tiene el entity_id del cliente autenticado
  const customerEntityId = ctx.customerContext?.customerEntityId ?? null

  if (!customerEntityId) {
    return Response.json({ error: 'No customer session' }, { status: 401 })
  }

  // Buscar el abonado vinculado a esta cuenta de cliente
  const subscriber = await kysely
    .selectFrom('isp_subscribers')
    .selectAll()
    .where('customer_entity_id', '=', customerEntityId)
    .where('tenant_id', '=', scope.tenantId)
    .where('deleted_at', 'is', null)
    .executeTakeFirst()

  if (!subscriber) {
    return Response.json({ error: 'No se encontró un abonado vinculado a esta cuenta' }, { status: 404 })
  }

  const s = subscriber as any

  // Balance: facturas pendientes
  const balanceResult = await kysely
    .selectFrom('isp_invoices')
    .select(kysely.fn.sum<string>('balance_usd').as('total'))
    .where('subscriber_id', '=', s.id)
    .where('tenant_id', '=', scope.tenantId)
    .where('status', 'in', ['pending', 'partial', 'overdue'])
    .where('deleted_at', 'is', null)
    .executeTakeFirst()

  // Tickets abiertos
  const openTicketsResult = await kysely
    .selectFrom('isp_support_tickets')
    .select(kysely.fn.count<number>('id').as('count'))
    .where('subscriber_id', '=', s.id)
    .where('tenant_id', '=', scope.tenantId)
    .where('status', 'not in', ['resolved', 'closed'])
    .executeTakeFirst()

  // Plan del servicio
  let plan = null
  if (s.plan_id) {
    plan = await kysely
      .selectFrom('isp_service_plans')
      .select(['name', 'download_mbps', 'upload_mbps', 'technology', 'monthly_price_usd'])
      .where('id', '=', s.plan_id)
      .executeTakeFirst()
  }

  return Response.json({
    subscriber: {
      id: s.id,
      account_number: s.account_number,
      subscriber_type: s.subscriber_type,
      service_status: s.service_status,
      installation_city: s.installation_city,
      monthly_price_usd: s.monthly_price_usd,
      billing_cycle_day: s.billing_cycle_day,
      last_payment_date: s.last_payment_date,
      activation_date: s.activation_date,
    },
    plan: plan ? {
      name: (plan as any).name,
      download_mbps: (plan as any).download_mbps,
      upload_mbps: (plan as any).upload_mbps,
      technology: (plan as any).technology,
      monthly_price_usd: (plan as any).monthly_price_usd,
    } : null,
    balance: {
      outstanding_usd: parseFloat((balanceResult as any)?.total ?? '0').toFixed(2),
      currency: 'USD',
    },
    open_tickets: Number((openTicketsResult as any)?.count ?? 0),
  })
}

export const openApi = {}
