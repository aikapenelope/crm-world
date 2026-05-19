/**
 * Generates pre-formatted publication text for a property.
 * Returns text ready to copy/paste + direct links to publishing platforms.
 *
 * Links are just URLs — no API integration with platforms.
 * The agent copies the text and opens the link to publish manually.
 */
import { z } from 'zod'
import type { EntityManager } from '@mikro-orm/core'
import { PropertyEntity } from '../../properties/data/entities'

const paramsSchema = z.object({
  id: z.string().uuid(),
})

export const metadata = {
  GET: { requireAuth: true, requireFeatures: ['properties.view'] },
}

// Platform publishing URLs (just links, no API)
const PLATFORM_URLS = {
  mercadolibre: 'https://www.mercadolibre.com.ve/publicar',
  facebook: 'https://www.facebook.com/marketplace/create/item',
  instagram: 'https://www.instagram.com/',
  tiktok: 'https://www.tiktok.com/upload',
} as const

export async function GET(request: Request, ctx: any) {
  const url = new URL(request.url)
  const id = url.searchParams.get('id')

  const parsed = paramsSchema.safeParse({ id })
  if (!parsed.success) {
    return Response.json({ error: 'Invalid property ID' }, { status: 400 })
  }

  const em: EntityManager = ctx.container.resolve('em')
  const scope = ctx.scope

  const property = await em.findOne(PropertyEntity, {
    id: parsed.data.id,
    tenant_id: scope.tenantId,
    deleted_at: null,
  } as any)

  if (!property) {
    return Response.json({ error: 'Property not found' }, { status: 404 })
  }

  // Generate publication text
  const operationLabel = property.operation === 'venta' ? 'VENTA'
    : property.operation === 'alquiler' ? 'ALQUILER'
    : 'VENTA/ALQUILER'

  const specs = [
    property.area_m2 ? `${property.area_m2} m²` : null,
    property.bedrooms ? `${property.bedrooms} hab.` : null,
    property.bathrooms ? `${property.bathrooms} baños` : null,
    property.parking ? `${property.parking} est.` : null,
  ].filter(Boolean).join(' | ')

  const text = [
    `🏠 ${operationLabel}: ${property.title}`,
    '',
    property.description ? property.description.slice(0, 300) : '',
    '',
    specs ? `📐 ${specs}` : '',
    `📍 ${property.city}${property.state ? `, ${property.state}` : ''}`,
    `💰 ${property.currency} ${property.price}`,
    '',
    '📲 Contáctame para más información',
  ].filter((line) => line !== null).join('\n')

  // WhatsApp share URL
  const whatsappText = encodeURIComponent(text)
  const whatsappUrl = `https://wa.me/?text=${whatsappText}`

  return Response.json({
    text,
    platforms: PLATFORM_URLS,
    share: {
      whatsapp: whatsappUrl,
      copy_text: text,
    },
  })
}

export const openApi = {}
