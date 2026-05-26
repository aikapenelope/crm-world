'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { LoadingMessage } from '@open-mercato/ui/backend/detail'
import { updateCrud } from '@open-mercato/ui/backend/utils/crud'
import { ArrowLeft, CheckCircle2, Circle, Clock, Wrench, Camera } from 'lucide-react'
import { useT } from '@open-mercato/shared/lib/i18n/context'

type Order = {
  id: string
  order_number: string
  status: string
  priority: string
  received_at: string
  customer_complaint: string | null
  diagnosis_notes: string | null
  total_labor: string
  total_parts: string
  total_amount: string
  currency: string
  estimated_completion: string | null
  assigned_technician_id: string | null
  notes: string | null
  km_at_entry: number
}

type OrderItem = {
  id: string
  type: 'labor' | 'part'
  description: string
  quantity: number
  unit_price: string
  total_price: string
  is_approved: boolean
  technician_notes: string | null
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

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Baja', normal: 'Normal', high: 'Alta', urgent: 'Urgente',
}

const STATUS_NEXT: Record<string, string> = {
  received: 'diagnosis', diagnosis: 'estimate_sent', estimate_sent: 'approved',
  approved: 'in_repair', in_repair: 'quality_check', quality_check: 'ready', ready: 'delivered',
}

const STATUS_NEXT_LABELS: Record<string, string> = {
  received: 'Iniciar Diagnóstico', diagnosis: 'Enviar Presupuesto', estimate_sent: 'Marcar Aprobado',
  approved: 'Iniciar Reparación', in_repair: 'Control de Calidad', quality_check: 'Marcar Listo', ready: 'Marcar Entregado',
}

export default function ServiceOrderDetailPage() {
  const t = useT()
  const params = useParams()
  const router = useRouter()
  const orderId = params?.id as string

  const [order, setOrder] = React.useState<Order | null>(null)
  const [items, setItems] = React.useState<OrderItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [advancing, setAdvancing] = React.useState(false)

  async function load() {
    setIsLoading(true)
    const [orderRes, itemsRes] = await Promise.all([
      apiCall<{ items: Order[] }>(`/api/auto-service-orders/orders?id=${orderId}`, undefined, { fallback: { items: [] } }),
      apiCall<{ items: OrderItem[] }>(`/api/auto-service-orders/items?service_order_id=${orderId}&pageSize=50`, undefined, { fallback: { items: [] } }),
    ])
    setOrder(orderRes.result?.items?.[0] ?? null)
    setItems(itemsRes.result?.items ?? [])
    setIsLoading(false)
  }

  React.useEffect(() => { if (orderId) load() }, [orderId])

  async function handleAdvanceStatus() {
    if (!order) return
    const nextStatus = STATUS_NEXT[order.status]
    if (!nextStatus) return
    setAdvancing(true)
    const res = await updateCrud('auto-service-orders/orders', { id: order.id, status: nextStatus })
    if (res.ok) {
      flash(t('auto_service_orders.detail.advanced', 'Estado actualizado'), 'success')
      await load()
    } else {
      flash(t('auto_service_orders.detail.advance_error', 'Error al actualizar estado'), 'error')
    }
    setAdvancing(false)
  }

  if (isLoading) return <LoadingMessage label={t('auto_service_orders.detail.loading', 'Cargando orden...')} />
  if (!order) return (
    <Page>
      <PageBody>
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />{t('auto_service_orders.detail.back_short', 'Volver')}
        </Button>
        <p className="mt-4 text-muted-foreground">{t('auto_service_orders.detail.not_found', 'Orden no encontrada.')}</p>
      </PageBody>
    </Page>
  )

  const currentStepIndex = TIMELINE_STEPS.findIndex(s => s.key === order.status)
  const isDelivered = order.status === 'delivered'
  const nextStatusLabel = STATUS_NEXT_LABELS[order.status]
  const laborItems = items.filter(i => i.type === 'labor')
  const partItems = items.filter(i => i.type === 'part')

  return (
    <Page>
      <PageBody>
        {/* Back + Header */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.push('/backend/auto_service_orders')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('auto_service_orders.detail.back', 'Órdenes de servicio')}
          </Button>
          <div className="mt-3 flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold">Orden {order.order_number}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Ingresada el {new Date(order.received_at).toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long' })}
                {' · '}{order.km_at_entry.toLocaleString('es-VE')} km
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {!isDelivered && nextStatusLabel && (
                <Button type="button" size="sm" onClick={handleAdvanceStatus} disabled={advancing}>
                  {advancing ? t('auto_service_orders.detail.advancing', 'Actualizando...') : nextStatusLabel}
                </Button>
              )}
              <Button type="button" variant="outline" size="sm" onClick={() => router.push('/backend/auto_service_orders/board')}>
                <Camera className="mr-2 size-4" />
                {t('auto_service_orders.detail.board_button', 'Tablero')}
              </Button>
            </div>
          </div>
          <div className="mt-2 flex gap-2 flex-wrap">
            <Badge variant={order.priority === 'urgent' ? 'destructive' : 'outline'}>
              {PRIORITY_LABELS[order.priority] ?? order.priority}
            </Badge>
            {order.estimated_completion && (
              <Badge variant="secondary">
                {t('auto_service_orders.detail.delivery_label', 'Entrega estimada')}: {new Date(order.estimated_completion).toLocaleDateString('es-VE')}
              </Badge>
            )}
          </div>
        </div>

        {/* Visual Timeline */}
        <div className="mb-6 rounded-lg border p-5">
          <h2 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wide">
            {t('auto_service_orders.detail.progress_title', 'Progreso')}
          </h2>
          <div className="relative">
            <div className="absolute top-4 left-4 right-4 h-0.5 bg-border" />
            <div
              className="absolute top-4 left-4 h-0.5 bg-primary transition-all duration-500"
              style={{ width: `${Math.max(0, (currentStepIndex / (TIMELINE_STEPS.length - 1)) * 100)}%` }}
            />
            <div className="relative flex justify-between">
              {TIMELINE_STEPS.map((step, idx) => {
                const isCompleted = idx < currentStepIndex
                const isCurrent = idx === currentStepIndex
                const Icon = step.icon
                return (
                  <div key={step.key} className="flex flex-col items-center">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all
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

        {/* Info grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-6">
          <div className="rounded-lg border p-4 space-y-3">
            <h3 className="text-sm font-semibold">{t('auto_service_orders.detail.reason_title', 'Motivo y Diagnóstico')}</h3>
            {order.customer_complaint ? (
              <p className="text-sm">{order.customer_complaint}</p>
            ) : (
              <p className="text-sm text-muted-foreground">{t('auto_service_orders.detail.no_description', 'Sin descripción')}</p>
            )}
            {order.diagnosis_notes && (
              <>
                <h3 className="text-sm font-semibold mt-3">{t('auto_service_orders.detail.diagnosis_title', 'Diagnóstico del técnico')}</h3>
                <p className="text-sm">{order.diagnosis_notes}</p>
              </>
            )}
            {order.notes && (
              <>
                <h3 className="text-sm font-semibold mt-3">{t('auto_service_orders.detail.notes_title', 'Notas internas')}</h3>
                <p className="text-sm text-muted-foreground">{order.notes}</p>
              </>
            )}
          </div>
          <div className="rounded-lg border p-4 space-y-3">
            <h3 className="text-sm font-semibold">{t('auto_service_orders.detail.financial_title', 'Resumen financiero')}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('auto_service_orders.detail.labor', 'Mano de obra')}</span>
                <span>{order.currency} {Number(order.total_labor).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('auto_service_orders.detail.parts', 'Repuestos')}</span>
                <span>{order.currency} {Number(order.total_parts).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between border-t pt-2 font-bold">
                <span>{t('auto_service_orders.detail.total', 'Total')}</span>
                <span className="text-lg">{order.currency} {Number(order.total_amount).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Items */}
        {items.length > 0 && (
          <div className="rounded-lg border overflow-hidden mb-6">
            <div className="px-4 py-3 border-b bg-muted/30">
              <h3 className="text-sm font-semibold">{t('auto_service_orders.detail.items_title', 'Trabajos y repuestos')}</h3>
            </div>
            <div className="divide-y">
              {[...laborItems, ...partItems].map((item) => (
                <div key={item.id} className="flex items-start justify-between px-4 py-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={item.type === 'labor' ? 'secondary' : 'outline'} className="text-xs">
                        {item.type === 'labor' ? t('auto_service_orders.detail.labor_badge', 'MO') : t('auto_service_orders.detail.part_badge', 'Repuesto')}
                      </Badge>
                      <span className="text-sm font-medium">{item.description}</span>
                      {!item.is_approved && (
                        <Badge variant="destructive" className="text-xs">{t('auto_service_orders.detail.rejected_badge', 'Rechazado')}</Badge>
                      )}
                    </div>
                    {item.technician_notes && (
                      <p className="text-xs text-muted-foreground mt-1">{item.technician_notes}</p>
                    )}
                  </div>
                  <div className="text-right ml-4 shrink-0">
                    <div className="text-sm">
                      {item.quantity > 1 && (
                        <span className="text-muted-foreground text-xs">{item.quantity} × {order.currency} {Number(item.unit_price).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                      )}
                    </div>
                    <div className="font-medium">{order.currency} {Number(item.total_price).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </PageBody>
    </Page>
  )
}
