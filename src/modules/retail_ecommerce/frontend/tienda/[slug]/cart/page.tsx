'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { Button } from '@open-mercato/ui/primitives/button'
import { ShoppingCart, Trash2 } from 'lucide-react'

type CartItem = {
  product_id: string
  product_title: string
  quantity: number
  unit_price: string
}

export default function CartPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  // Cart state (localStorage-based for simplicity)
  const [items, setItems] = React.useState<CartItem[]>([])
  const [guestName, setGuestName] = React.useState('')
  const [guestPhone, setGuestPhone] = React.useState('')
  const [deliveryType, setDeliveryType] = React.useState<'delivery' | 'pickup'>('delivery')
  const [paymentMethod, setPaymentMethod] = React.useState('pago_movil')
  const [notes, setNotes] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    const stored = localStorage.getItem(`cart_${slug}`)
    if (stored) setItems(JSON.parse(stored))
  }, [slug])

  function removeItem(index: number) {
    const updated = items.filter((_, i) => i !== index)
    setItems(updated)
    localStorage.setItem(`cart_${slug}`, JSON.stringify(updated))
  }

  const subtotal = items.reduce((sum, item) => sum + item.quantity * Number(item.unit_price), 0)
  const tax = subtotal * 0.16
  const total = subtotal + tax

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault()
    if (items.length === 0 || !guestName || !guestPhone) return

    setIsSubmitting(true)
    const call = await apiCall('/api/retail-ecommerce/orders', {
      method: 'POST',
      body: JSON.stringify({
        guest_name: guestName,
        guest_phone: guestPhone,
        delivery_type: deliveryType,
        payment_method: paymentMethod,
        notes: notes || null,
        source: 'web',
        lines: items.map((item) => ({
          product_id: item.product_id,
          product_title: item.product_title,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
      }),
    })

    if (call.ok) {
      localStorage.removeItem(`cart_${slug}`)
      setItems([])
      flash('Pedido enviado exitosamente. Te contactaremos por WhatsApp.', 'success')
      router.push(`/tienda/${slug}`)
    } else {
      flash('Error al enviar el pedido', 'error')
    }
    setIsSubmitting(false)
  }

  const fmt = (val: number) => val.toLocaleString('es-VE', { minimumFractionDigits: 2 })

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <ShoppingCart className="size-5" />
          <h1 className="text-xl font-bold">Carrito</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {items.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="size-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">Tu carrito está vacío</p>
            <Button type="button" variant="outline" className="mt-4" onClick={() => router.push(`/tienda/${slug}`)}>
              Seguir Comprando
            </Button>
          </div>
        ) : (
          <form onSubmit={handleCheckout} className="space-y-6">
            {/* Items */}
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium text-sm">{item.product_title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity} x USD {Number(item.unit_price).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-sm">
                      USD {(item.quantity * Number(item.unit_price)).toFixed(2)}
                    </span>
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeItem(index)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span><span>USD {fmt(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>IVA (16%)</span><span>USD {fmt(tax)}</span>
              </div>
              <div className="flex justify-between font-bold border-t pt-2">
                <span>Total</span><span>USD {fmt(total)}</span>
              </div>
            </div>

            {/* Customer Info */}
            <div className="space-y-3">
              <h3 className="font-semibold">Datos de Contacto</h3>
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder="Nombre completo *"
                required
              />
              <input
                type="text"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder="WhatsApp (+58 4XX-XXX-XXXX) *"
                required
              />
            </div>

            {/* Delivery */}
            <div className="space-y-3">
              <h3 className="font-semibold">Entrega</h3>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    checked={deliveryType === 'delivery'}
                    onChange={() => setDeliveryType('delivery')}
                  />
                  Delivery
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    checked={deliveryType === 'pickup'}
                    onChange={() => setDeliveryType('pickup')}
                  />
                  Retiro en Tienda
                </label>
              </div>
            </div>

            {/* Payment */}
            <div className="space-y-3">
              <h3 className="font-semibold">Método de Pago</h3>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value="pago_movil">Pago Móvil</option>
                <option value="zelle">Zelle</option>
                <option value="binance">Binance (USDT)</option>
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
                rows={2}
                placeholder="Notas adicionales (opcional)"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Enviando...' : `Enviar Pedido — USD ${fmt(total)}`}
            </Button>
          </form>
        )}
      </main>
    </div>
  )
}
