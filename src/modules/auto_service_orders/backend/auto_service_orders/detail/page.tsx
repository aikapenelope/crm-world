'use client'

import * as React from 'react'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { CheckCircle2, Circle, Clock, Wrench, Camera, MessageCircle } from 'lucide-react'

/**
 * Service Order Detail Page with Visual Timeline.
 * Shows the order progress through each status step.
 */

type Order = {
  id: string
  order_number: string
  status: string
  received_at: string
  customer_complaint: string | null
  diagnosis_notes: string | null
  priority: string
  total_amount: string
  currency: string
  estimated_completion: string | null
}

const TIMELINE_STEPS = [
  { key: 'received', label: 'Recibido', icon: Circle },
  { key: 'diagnosis', label: 'Diagnóstico', icon: Clock },
  { key: 'estimate_sent', label: 'Presupuesto', icon: Circle },
  { key: 'approved', label: 'Aprobado', icon: CheckCircle2 },
  { key: 'in_repair', label: 'En Reparación', icon: Wrench },
  { key: 'quality_check', label: 'Control', icon: Circle },
  { key: 'ready', label: 'Listo', icon: CheckCircle2 },
  { key: 'delivered', label: 'Entregado', icon: CheckCircle2 },
]

export default function ServiceOrderDetailPage() {
  const [order, setOrder] = React.useState<Order | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  const orderId = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('id') : null

  React.useEffect(() => {
    if (!orderId) return
    async function load() {
      setIsLoading(true)
      const call = await apiCall<{ items: Order[] }>(`/api/auto-service-orders/orders?pageSize=1&search=${orderId}`, undefined, { fallback: { items: [] } })
      if (call.ok && call.result?.items?.[0]) setOrder(call.result.items[0])
      setIsLoading(false)
    }
    load()
  }, [orderId])

  if (isLoading || !order) {
    return <Page><PageBody><div className="text-center py-8 text-muted-foreground">Cargando orden...</div></PageBody></Page>
  }

  // Determine current step index
  const currentStepIndex = TIMELINE_STEPS.findIndex((s) => s.key === order.status)

  return (
    <Page>
      <PageBody>
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Orden {order.order_number}</h1>
            <p className="text-sm text-muted-foreground">
              Ingresado: {new Date(order.received_at).toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm">
              <Camera className="mr-2 size-4" />
              Inspección
            </Button>
            <Button type="button" size="sm" className="bg-[#25D366] hover:bg-[#25D366]/90 text-white">
              <MessageCircle className="mr-2 size-4" />
              WhatsApp
            </Button>
          </div>
        </div>

        {/* Visual Timeline */}
        <div className="mb-8 rounded-lg border p-6">
          <h2 className="text-sm font-semibold mb-4">Progreso</h2>
          <div className="relative">
            {/* Progress bar background */}
            <div className="absolute top-4 left-4 right-4 h-0.5 bg-border" />
            {/* Progress bar filled */}
            <div
              className="absolute top-4 left-4 h-0.5 bg-primary transition-all duration-500"
              style={{ width: `${Math.max(0, (currentStepIndex / (TIMELINE_STEPS.length - 1)) * 100)}%` }}
            />

            {/* Steps */}
            <div className="relative flex justify-between">
              {TIMELINE_STEPS.map((step, idx) => {
                const isCompleted = idx < currentStepIndex
                const isCurrent = idx === currentStepIndex
                const Icon = step.icon

                return (
                  <div key={step.key} className="flex flex-col items-center">
                    <div className={`
                      flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all
                      ${isCompleted ? 'bg-primary border-primary text-primary-foreground' : ''}
                      ${isCurrent ? 'bg-primary/10 border-primary text-primary ring-4 ring-primary/20' : ''}
                      ${!isCompleted && !isCurrent ? 'bg-background border-border text-muted-foreground' : ''}
                    `}>
                      <Icon className="size-4" />
                    </div>
                    <span className={`mt-2 text-xs text-center max-w-[60px] ${isCurrent ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                      {step.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-lg border p-4 space-y-3">
            <h3 className="text-sm font-semibold">Motivo de Ingreso</h3>
            <p className="text-sm">{order.customer_complaint ?? 'No especificado'}</p>
            {order.diagnosis_notes && (
              <>
                <h3 className="text-sm font-semibold mt-4">Diagnóstico</h3>
                <p className="text-sm">{order.diagnosis_notes}</p>
              </>
            )}
          </div>
          <div className="rounded-lg border p-4 space-y-3">
            <h3 className="text-sm font-semibold">Información</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Prioridad</span>
                <Badge variant={order.priority === 'urgent' ? 'destructive' : 'outline'}>
                  {order.priority === 'urgent' ? 'Urgente' : order.priority === 'high' ? 'Alta' : order.priority === 'low' ? 'Baja' : 'Normal'}
                </Badge>
              </div>
              {order.estimated_completion && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Entrega estimada</span>
                  <span className="font-medium">{new Date(order.estimated_completion).toLocaleDateString('es-VE')}</span>
                </div>
              )}
              {Number(order.total_amount) > 0 && (
                <div className="flex justify-between border-t pt-2">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-bold text-lg">{order.currency} {Number(order.total_amount).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </PageBody>
    </Page>
  )
}
