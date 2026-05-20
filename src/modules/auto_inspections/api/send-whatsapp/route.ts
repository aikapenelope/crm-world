/**
 * Send Inspection via WhatsApp API.
 * Generates a wa.me link with the public inspection URL and a message.
 */
export const metadata = {
  GET: { requireAuth: true, requireFeatures: ['auto_inspections.send'] },
}

export async function GET(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()
  const url = new URL(request.url)
  const inspectionId = url.searchParams.get('inspection_id')

  if (!inspectionId) {
    return Response.json({ error: 'inspection_id is required' }, { status: 400 })
  }

  // Get inspection
  const inspection = await kysely
    .selectFrom('auto_inspections')
    .selectAll()
    .where('id', '=', inspectionId)
    .where('tenant_id', '=', scope.tenantId)
    .executeTakeFirst()

  if (!inspection) {
    return Response.json({ error: 'Inspection not found' }, { status: 404 })
  }

  // Get vehicle
  const vehicle = await kysely
    .selectFrom('auto_vehicles')
    .select(['plate', 'brand', 'model', 'year', 'customer_id'])
    .where('id', '=', (inspection as any).vehicle_id)
    .executeTakeFirst()

  // Get customer phone
  let phone: string | null = null
  let customerName = 'Cliente'
  if (vehicle) {
    const customer = await kysely
      .selectFrom('customer_people')
      .select(['display_name', 'primary_phone'])
      .where('id', '=', (vehicle as any).customer_id)
      .executeTakeFirst()
    if (customer) {
      phone = (customer as any).primary_phone
      customerName = (customer as any).display_name ?? 'Cliente'
    }
  }

  // Get organization name
  const org = await kysely
    .selectFrom('organizations')
    .select(['name'])
    .where('id', '=', scope.organizationId)
    .executeTakeFirst()
  const shopName = (org as any)?.name ?? 'el taller'

  // Get inspection items summary
  const items = await kysely
    .selectFrom('auto_inspection_items')
    .select(['condition', 'system_category'])
    .where('inspection_id', '=', inspectionId)
    .execute()

  const critical = (items as any[]).filter((i: any) => i.condition === 'critical').length
  const needsAttention = (items as any[]).filter((i: any) => i.condition === 'needs_attention').length
  const good = (items as any[]).filter((i: any) => i.condition === 'good').length

  // Build public link
  const appUrl = process.env.APP_URL ?? 'https://mercato.novaincs.com'
  const publicLink = `${appUrl}/inspection?id=${inspectionId}`

  // Build WhatsApp message
  const vehicleLabel = vehicle ? `${(vehicle as any).brand} ${(vehicle as any).model} ${(vehicle as any).year} (${(vehicle as any).plate})` : 'su vehículo'

  const conditionSummary = []
  if (critical > 0) conditionSummary.push(`⚠️ ${critical} punto(s) crítico(s)`)
  if (needsAttention > 0) conditionSummary.push(`🔶 ${needsAttention} requiere(n) atención`)
  if (good > 0) conditionSummary.push(`✅ ${good} en buen estado`)

  const message = `Estimado/a ${customerName},

Hemos completado la inspección de ${vehicleLabel}.

${conditionSummary.join('\n')}

📋 Ver inspección completa con fotos:
${publicLink}

Si tiene preguntas o desea aprobar el trabajo recomendado, responda a este mensaje.

_${shopName}_`

  // Build wa.me link
  const cleanPhone = phone ? phone.replace(/[^0-9+]/g, '').replace(/^\+/, '') : null
  const waLink = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}` : null

  // Update inspection as sent
  await kysely
    .updateTable('auto_inspections')
    .set({ status: 'sent_to_customer', sent_to_customer_at: new Date() })
    .where('id', '=', inspectionId)
    .execute()

  return Response.json({
    ok: true,
    inspection_id: inspectionId,
    public_link: publicLink,
    wa_link: waLink,
    phone,
    customer_name: customerName,
    message,
    summary: { critical, needs_attention: needsAttention, good, total: items.length },
  })
}

export const openApi = {}
