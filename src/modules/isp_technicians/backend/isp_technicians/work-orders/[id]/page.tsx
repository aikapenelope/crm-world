'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { apiCall, apiCallOrThrow } from '@open-mercato/ui/backend/utils/apiCall'
import { LoadingMessage, ErrorMessage } from '@open-mercato/ui/backend/detail'
import { Button } from '@open-mercato/ui/primitives/button'
import { StatusBadge } from '@open-mercato/ui/primitives/status-badge'
import { ArrowLeft, CheckCircle } from 'lucide-react'

const TYPE_LABELS: Record<string, string> = {
  installation: 'Instalación', repair: 'Reparación', equipment_swap: 'Cambio equipo',
  uninstall: 'Retiro', verification: 'Verificación',
}
const STATUS_VARIANT: Record<string, 'warning' | 'info' | 'success' | 'neutral'> = {
  pending: 'warning', scheduled: 'info', in_progress: 'info', completed: 'success', cancelled: 'neutral',
}

type PageState = 'loading' | 'notFound' | 'error' | 'ready'

export default function WorkOrderDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [state, setState] = React.useState<PageState>('loading')
  const [order, setOrder] = React.useState<any>(null)
  const [completionNotes, setCompletionNotes] = React.useState('')
  const [kmTraveled, setKmTraveled] = React.useState('')
  const [completing, setCompleting] = React.useState(false)

  const load = React.useCallback(async () => {
    setState('loading')
    const res = await apiCall<{ items: any[] }>(`/api/isp-technicians/work-orders?id=${params.id}`)
    const item = res.result?.items?.[0] ?? null
    if (!item) { setState('notFound'); return }
    setOrder(item)
    setState('ready')
  }, [params.id])

  React.useEffect(() => { load() }, [load])

  const completeOrder = async () => {
    if (!completionNotes.trim() || completing) return
    setCompleting(true)
    try {
      await apiCallOrThrow('/api/isp-technicians/work-orders/complete', {
        method: 'POST',
        body: JSON.stringify({
          work_order_id: params.id,
          completion_notes: completionNotes,
          km_traveled: kmTraveled || null,
        }),
      })
      flash('OT completada. Si es instalación, el abonado se activará automáticamente.', 'success')
      load()
    } catch { flash('Error al completar OT', 'error') }
    finally { setCompleting(false) }
  }

  if (state === 'loading') return <Page><PageBody><LoadingMessage label="Cargando..." /></PageBody></Page>
  if (state === 'notFound') return <Page><PageBody><ErrorMessage label="OT no encontrada." /></PageBody></Page>

  const isActive = ['pending', 'scheduled', 'in_progress'].includes(order.status)

  return (
    <Page>
      <PageBody>
        <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/backend/isp-technicians/work-orders')} className="mb-4">
          <ArrowLeft className="mr-2 size-4" /> Órdenes de Trabajo
        </Button>

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{order.work_order_number}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {TYPE_LABELS[order.type] ?? order.type}
              {order.scheduled_date && ` · ${new Date(order.scheduled_date).toLocaleDateString('es-VE')}`}
              {order.scheduled_time && ` ${order.scheduled_time}`}
            </p>
          </div>
          <StatusBadge variant={STATUS_VARIANT[order.status] ?? 'neutral'} dot>
            {order.status}
          </StatusBadge>
        </div>

        {/* Location */}
        <div className="p-4 bg-muted/30 rounded-lg border border-border mb-6">
          <p className="text-sm font-medium">Dirección</p>
          <p className="text-sm mt-1">{order.address}</p>
          {order.instructions && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Instrucciones</p>
              <p className="text-sm">{order.instructions}</p>
            </div>
          )}
        </div>

        {/* Complete */}
        {isActive && (
          <div className="p-4 border border-border rounded-lg">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <CheckCircle className="size-4 text-status-success-icon" /> Completar orden
            </h3>
            <textarea
              className="w-full text-sm border border-input rounded-md p-3 min-h-[80px] bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring mb-3"
              placeholder="Descripción del trabajo realizado..."
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
            />
            <input
              type="text" className="w-full text-sm border border-input rounded-md p-2 bg-background mb-3 focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Kilómetros recorridos (opcional)"
              value={kmTraveled}
              onChange={(e) => setKmTraveled(e.target.value)}
            />
            <div className="flex justify-end">
              <Button type="button" disabled={!completionNotes.trim() || completing} onClick={completeOrder}>
                <CheckCircle className="size-4 mr-2" /> Marcar como completada
              </Button>
            </div>
          </div>
        )}

        {order.completion_notes && (
          <div className="mt-4 p-4 bg-status-success-bg border border-status-success-border rounded-lg">
            <p className="text-xs font-semibold text-status-success-text uppercase mb-1">Trabajo realizado</p>
            <p className="text-sm">{order.completion_notes}</p>
            {order.km_traveled && <p className="text-xs text-muted-foreground mt-1">Kilómetros: {order.km_traveled} km</p>}
          </div>
        )}
      </PageBody>
    </Page>
  )
}
