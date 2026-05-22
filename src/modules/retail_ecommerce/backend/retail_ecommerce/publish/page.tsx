'use client'

import * as React from 'react'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import { Share2 } from 'lucide-react'

export default function PublishPage() {
  const [productId, setProductId] = React.useState('')
  const [platform, setPlatform] = React.useState('instagram')
  const [content, setContent] = React.useState('')
  const [hashtags, setHashtags] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  async function handlePublish(e: React.FormEvent) {
    e.preventDefault()
    if (!productId || !content) return

    setIsSubmitting(true)
    const call = await apiCall('/api/retail-ecommerce/publish', {
      method: 'POST',
      body: JSON.stringify({
        product_id: productId,
        platform,
        content,
        hashtags: hashtags || null,
      }),
    })

    if (call.ok) {
      flash('Publicación creada exitosamente', 'success')
      setContent('')
      setHashtags('')
    } else {
      flash('Error al crear la publicación', 'error')
    }
    setIsSubmitting(false)
  }

  function generateTemplate() {
    const templates: Record<string, string> = {
      instagram: '🛍️ ¡Nuevo producto disponible!\n\n📦 [Nombre del producto]\n💰 Precio: USD [precio]\n\n📍 Disponible en todas nuestras sucursales\n📲 Pedidos por DM o WhatsApp\n\n#TiendaVE #Ofertas #Disponible',
      whatsapp: '¡Hola! 👋\n\nTenemos disponible:\n\n📦 *[Nombre del producto]*\n💰 Precio: USD [precio]\n\n✅ Disponible para entrega inmediata\n📍 Retiro en tienda o delivery\n\n¿Te interesa? Responde este mensaje.',
      tiktok: '🔥 ¡Mira lo que llegó! #NuevoProducto #TiendaVE #Disponible',
      facebook: '🛍️ ¡Nuevo en stock!\n\n[Nombre del producto] - USD [precio]\n\nDisponible para entrega inmediata. Escríbenos para más info.',
    }
    setContent(templates[platform] ?? '')
    setHashtags(platform === 'instagram' ? '#TiendaVE #Ofertas #Venezuela #Disponible' : '')
  }

  return (
    <Page>
      <PageBody>
        <div className="mb-6 flex items-center gap-3">
          <Share2 className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Publicar en Redes</h1>
            <p className="text-sm text-muted-foreground">Genera contenido para Instagram, WhatsApp, TikTok y Facebook</p>
          </div>
        </div>

        <form onSubmit={handlePublish} className="max-w-2xl space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">ID del Producto *</label>
            <input
              type="text"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm font-mono"
              placeholder="UUID del producto del catálogo"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Plataforma</label>
            <div className="flex gap-2">
              {[
                { id: 'instagram', label: 'Instagram' },
                { id: 'whatsapp', label: 'WhatsApp' },
                { id: 'tiktok', label: 'TikTok' },
                { id: 'facebook', label: 'Facebook' },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPlatform(id)}
                  className={`px-3 py-1.5 rounded-md text-sm border ${platform === id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="button" variant="outline" size="sm" onClick={generateTemplate}>
              Generar Plantilla
            </Button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Contenido *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              rows={8}
              placeholder="Escribe el texto de la publicación..."
              required
            />
          </div>

          {platform === 'instagram' && (
            <div>
              <label className="block text-sm font-medium mb-1">Hashtags</label>
              <input
                type="text"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder="#TiendaVE #Ofertas #Venezuela"
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Crear Publicación'}
            </Button>
          </div>
        </form>
      </PageBody>
    </Page>
  )
}
