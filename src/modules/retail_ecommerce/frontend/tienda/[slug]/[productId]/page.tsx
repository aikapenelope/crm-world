'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@open-mercato/ui/primitives/button'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { ShoppingCart, ArrowLeft } from 'lucide-react'

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const productId = params.productId as string

  const [quantity, setQuantity] = React.useState(1)

  function addToCart() {
    const cartKey = `cart_${slug}`
    const stored = localStorage.getItem(cartKey)
    const items = stored ? JSON.parse(stored) : []

    // Check if already in cart
    const existing = items.find((i: any) => i.product_id === productId)
    if (existing) {
      existing.quantity += quantity
    } else {
      items.push({
        product_id: productId,
        product_title: `Producto ${productId.slice(0, 8)}`,
        quantity,
        unit_price: '0.00', // Price would come from catalog in production
      })
    }

    localStorage.setItem(cartKey, JSON.stringify(items))
    flash(`Agregado al carrito (${quantity} unidad${quantity > 1 ? 'es' : ''})`, 'success')
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            type="button"
            onClick={() => router.push(`/tienda/${slug}`)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Volver al catálogo
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Image placeholder */}
          <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
            <ShoppingCart className="size-16 text-muted-foreground/20" />
          </div>

          {/* Product info */}
          <div className="space-y-4">
            <h1 className="text-2xl font-bold">Producto</h1>
            <p className="text-sm text-muted-foreground font-mono">ID: {productId}</p>

            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium">Cantidad:</label>
                <div className="flex items-center border rounded-md">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-1 text-lg"
                  >
                    -
                  </button>
                  <span className="px-4 py-1 border-x font-medium">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-1 text-lg"
                  >
                    +
                  </button>
                </div>
              </div>

              <Button type="button" className="w-full" onClick={addToCart}>
                <ShoppingCart className="mr-2 size-4" />
                Agregar al Carrito
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
