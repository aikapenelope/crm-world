/**
 * Generate WhatsApp collection messages for debtors.
 * Returns wa.me links for mass collection.
 */
export const metadata = {
  GET: { requireAuth: true, requireFeatures: ['condo_collections.whatsapp'] },
}

export async function GET(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()
  const url = new URL(request.url)
  const buildingId = url.searchParams.get('building_id')

  // Get overdue receipts with owner phone
  let query = kysely
    .selectFrom('condo_receipts')
    .innerJoin('condo_units', 'condo_units.id', 'condo_receipts.unit_id')
    .select([
      'condo_receipts.unit_id',
      'condo_receipts.owner_name',
      'condo_receipts.unit_number',
      'condo_receipts.total_amount',
      'condo_receipts.paid_amount',
      'condo_receipts.period_month',
      'condo_units.owner_phone',
    ])
    .where('condo_receipts.tenant_id', '=', scope.tenantId)
    .where('condo_receipts.organization_id', '=', scope.organizationId)
    .where('condo_receipts.status', 'in', ['pending', 'overdue', 'partial'])

  if (buildingId) {
    query = query.where('condo_receipts.building_id', '=', buildingId)
  }

  const results = await query.execute()

  // Group by unit and generate messages
  const unitMessages = new Map<string, any>()
  for (const r of results as any[]) {
    const key = r.unit_id as string
    const debt = Number(r.total_amount) - Number(r.paid_amount)
    const existing = unitMessages.get(key)

    if (existing) {
      existing.total_debt += debt
      existing.periods.push(r.period_month)
    } else {
      unitMessages.set(key, {
        unit_id: r.unit_id,
        owner_name: r.owner_name,
        unit_number: r.unit_number,
        owner_phone: r.owner_phone,
        total_debt: debt,
        periods: [r.period_month],
      })
    }
  }

  const messages = Array.from(unitMessages.values())
    .filter((m) => m.owner_phone)
    .map((m) => {
      const phone = (m.owner_phone as string).replace(/[^0-9]/g, '')
      const periodsText = m.periods.join(', ')
      const message = `Estimado/a ${m.owner_name}, le recordamos que tiene un saldo pendiente de condominio por USD ${m.total_debt.toFixed(2)} correspondiente a: ${periodsText}. Unidad ${m.unit_number}. Agradecemos su pronto pago. Gracias.`
      const waLink = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`

      return {
        unit_id: m.unit_id,
        owner_name: m.owner_name,
        unit_number: m.unit_number,
        phone: m.owner_phone,
        total_debt: m.total_debt.toFixed(2),
        periods: m.periods,
        message,
        wa_link: waLink,
      }
    })
    .sort((a, b) => Number(b.total_debt) - Number(a.total_debt))

  return Response.json({
    items: messages,
    total: messages.length,
    total_debt: messages.reduce((s, m) => s + Number(m.total_debt), 0).toFixed(2),
  })
}

export const openApi = {}
