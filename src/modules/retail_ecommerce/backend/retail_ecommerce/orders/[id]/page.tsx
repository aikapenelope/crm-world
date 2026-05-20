'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import { ShoppingCart, Phone, MapPin } from 'lucide-react'

type Order = {
  id: string
  order_number: string
  guest_name: string | null
  guest_phone: string | null
  guest_email: string | null
  status: string
  payment_status: string
  payment_method: string | null
  payment_reference: string | null
  delivery_type: string
  delivery_address: Record<string, string> | null
  subtotal: string
  tax_amount: string
  delivery_fee: string
  total: string
  currency: string
  source: string
  notes: string | null
  created_at: string
}

const statusFlow = ['pending', 'confirmed', 'preparing', 'ready', 'delivering', 'delivered']

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string
  const [order, setOrder] = React.useState<Order | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const call = await apiCall<{ item: Order }>(
        `/api/retail-ecommerce/orders?id=${orderId}`,
        undefined,
        { fallback: null as any },
      )
      if (call.ok && call.result) {
        setOrder(call.result.item)
      }
      setIsLoading(false)
    }
    load()
  }, [orderId])

  async function advanceStatus() {
    if (!order) return
    const currentIdx = statusFlow.indexOf(order.status)
    if (currentIdx < 0 || currentIdx >= statusFlow.length - 1) return
    const nextStatus = statusFlow[currentIdx + 1]

    const call = await apiCall('/api/retail-ecommerce/orders', {
      method: 'PUT',
      body: JSON.stringify({ id: order.id, status: nextStatus }),
    })
    if (call.ok) {
      setOrder({ ...order, status: nextStatus })
      flash(`Pedido actualizado a: ${nextStatus}`, 'success')
    }
  }

  async function confirmPayment() {
    if (!order) return
    const call = await apiCall('/api/retail-ecommerce/orders', {
      method: 'PUT',
      body: JSON.stringify({ id: order.id, payment_status: 'confirmed' }),
    })
    if (call.ok) {
      setOrder({ ...order, payment_status: 'confirmed' })
      flash('Pago confirmado', 'success')
    }
  }

  if (isLoading) {
    return <Page><PageBody><div className="text-center py-8 text-muted-foreground">Cargando...</div></PageBody></Page>
  }

  if (!order) {
    return <Page><PageBody><div className="text-center py-8 text-muted-foreground">Pedido no encontrado.</div></PageBody></Page>
  }

  const fmt = (val: string) => Number(val).toLocaleString('es-VE', { minimumFractionDigits: 2 })

  return (
    <Page>
      <PageBody>
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingCart className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">{order.order_number}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline">{order.source}</Badge>
                <span>{new Date(order.created_at).toLocaleString('es-VE')}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {order.payment_status === 'pending' && (
              <Button type="button" variant="outline" onClick={confirmPayment}>
                Confirmar Pago
              </Button>
            )}
            {statusFlow.indexOf(order.status) < statusFlow.length - 1 && order.status !== 'cancelled' && (
              <Button type="button" onClick={advanceStatus}>
                Avanzar Estado
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Volver
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          {/* Status & Payment */}
          <div className="rounded-lg border p-4 space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase">Estado</h3>
            <div className="flex items-center gap-2">
              <Badge variant={order.status === 'cancelled' ? 'destructive' : 'default'}>{order.status}</Badge>
              <Badge variant={order.payment_status === 'confirmed' ? 'default' : 'outline'}>
                Pago: {order.payment_status}
              </Badge>
            </div>
            {order.payment_method && <p className="text-sm">Método: {order.payment_method}</p>}
            {order.payment_reference && <p className="text-sm font-mono">Ref: {order.payment_reference}</p>}
          </div>

          {/* Customer */}
          <div className="rounded-lg border p-4 space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase">Cliente</h3>
            <p className="text-sm font-medium">{order.guest_name ?? 'Cliente registrado'}</p>
            {order.guest_phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="size-3" />
                <a href={`https://wa.me/${order.guest_phone.replace(/\D/g, '')}`} className="text-primary underline">
                  {order.guest_phone}
                </a>
              </div>
            )}
            {order.guest_email && <p className="text-sm text-muted-foreground">{order.guest_email}</p>}
          </div>

          {/* Delivery */}
          <div className="rounded-lg border p-4 space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase">Entrega</h3>
            <Badge variant="outline">{order.delivery_type === 'pickup' ? 'Retiro en Tienda' : 'Delivery'}</Badge>
            {order.delivery_address && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="size-3 mt-0.5" />
                <span>
                  {Object.values(order.delivery_address).filter(Boolean).join(', ')}
                </span>
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="rounded-lg border p-4 space-y-2">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase">Totales</h3>
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{order.currency} {fmt(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>IVA (16%)</span>
              <span>{order.currency} {fmt(order.tax_amount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Delivery</span>
              <span>{order.currency} {fmt(order.delivery_fee)}</span>
            </div>
            <div className="flex justify-between font-bold border-t pt-2">
              <span>Total</span>
              <span>{order.currency} {fmt(order.total)}</span>
            </div>
          </div>
        </div>

        {order.notes && (
          <div className="mt-6 max-w-4xl rounded-lg border p-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase mb-2">Notas</h3>
            <p className="text-sm">{order.notes}</p>
          </div>
        )}
      </PageBody>
    </Page>
  )
}
