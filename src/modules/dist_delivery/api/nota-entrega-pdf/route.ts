/**
 * API route: Generate delivery note PDF
 * GET /api/dist-delivery/nota-entrega-pdf?id=ORDER_ID
 */
// @ts-ignore
import { renderToStream } from '@react-pdf/renderer'
import * as React from 'react'
import { NotaEntregaDist, type NotaEntregaPDFData, type NotaEntregaItem } from '../../documents/NotaEntregaDist'
import { loadOrgBranding } from '@/lib/pdf/org-branding'

export const metadata = {
  GET: { requireAuth: true, requireFeatures: ['dist_delivery.view'] },
}

export async function GET(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const kysely = (em as any).getKysely()
  const url = new URL(request.url)
  const id = url.searchParams.get('id')

  if (!id) return Response.json({ error: 'id is required' }, { status: 400 })

  const order = await kysely.selectFrom('dist_delivery_orders').selectAll()
    .where('id', '=', id)
    .where('tenant_id', '=', scope.tenantId)
    .executeTakeFirst()

  if (!order) return Response.json({ error: 'Order not found' }, { status: 404 })
  const o = order as any

  // Load items with product/customer names (cross-module Kysely queries)
  const items = await kysely.selectFrom('dist_delivery_items')
    .select(['customer_id', 'product_id', 'quantity_dispatched', 'status', 'delivery_notes'])
    .where('delivery_order_id', '=', id)
    .execute()

  // Enrich items with names
  const enrichedItems: NotaEntregaItem[] = []
  for (const item of items as any[]) {
    let customerName = 'Cliente'
    let productName = 'Producto'
    let productSku: string | null = null
    let unit: string | null = null

    try {
      const customer = await kysely.selectFrom('customer_people_profiles')
        .select(['display_name'])
        .where('id', '=', item.customer_id)
        .executeTakeFirst()
      customerName = (customer as any)?.display_name ?? customerName
    } catch { /* cross-module lookup */ }

    try {
      const product = await kysely.selectFrom('catalog_products')
        .select(['name', 'sku', 'unit'])
        .where('id', '=', item.product_id)
        .executeTakeFirst()
      if (product) {
        productName = (product as any).name
        productSku = (product as any).sku ?? null
        unit = (product as any).unit ?? null
      }
    } catch { /* cross-module lookup */ }

    enrichedItems.push({
      customer_name: customerName,
      product_name: productName,
      product_sku: productSku,
      quantity_dispatched: item.quantity_dispatched,
      unit,
      status: item.status,
      delivery_notes: item.delivery_notes ?? null,
    })
  }

  // Get driver name if available
  let driverName: string | null = null
  if (o.driver_id) {
    try {
      const staff = await kysely.selectFrom('staff').select(['name'])
        .where('id', '=', o.driver_id).executeTakeFirst()
      driverName = (staff as any)?.name ?? null
    } catch { /* staff lookup */ }
  }

  const org = await loadOrgBranding(kysely, scope)

  // Generate delivery number from id
  const deliveryNumber = `ND-${o.id.replace(/-/g, '').slice(0, 8).toUpperCase()}`

  const data: NotaEntregaPDFData = {
    org,
    deliveryNumber,
    dispatchDate: o.dispatch_date,
    status: o.status,
    vehiclePlate: o.vehicle_plate ?? null,
    driverName,
    notes: o.notes ?? null,
    items: enrichedItems,
    totalItems: o.total_items ?? enrichedItems.length,
    deliveredItems: o.delivered_items ?? enrichedItems.filter(i => i.status === 'delivered').length,
    id: o.id,
  }

  const stream = await renderToStream(React.createElement(NotaEntregaDist, { data }))
  const chunks: Buffer[] = []
  for await (const chunk of stream) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  const pdfBuffer = Buffer.concat(chunks)
  const filename = `nota-entrega-${deliveryNumber}.pdf`

  return new Response(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(pdfBuffer.length),
      'Cache-Control': 'no-cache',
    },
  })
}

export const openApi = {}
