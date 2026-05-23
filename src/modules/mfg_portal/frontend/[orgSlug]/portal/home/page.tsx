'use client'

import * as React from 'react'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { StatusBadge } from '@open-mercato/ui/primitives/status-badge'
import { FileText, Package, Truck, CheckCircle } from 'lucide-react'

type OrderRow = {
  id: string; order_number: string; status: string; total_usd: string
  currency: string; scheduled_dispatch_date: string | null; actual_dispatch_date: string | null
  requires_coa: boolean; created_at: string
}

const STATUS_VARIANT: Record<string, 'neutral' | 'info' | 'warning' | 'success' | 'error'> = {
  draft: 'neutral', confirmed: 'info', in_preparation: 'warning',
  dispatched: 'warning', invoiced: 'success', cancelled: 'error',
}
const STATUS_LABEL: Record<string, string> = {
  draft: 'Procesando', confirmed: 'Confirmado', in_preparation: 'Preparando',
  dispatched: 'En tránsito', invoiced: 'Entregado', cancelled: 'Cancelado',
}
const STATUS_ICON: Record<string, React.ReactNode> = {
  confirmed: <Package className="size-4" />,
  in_preparation: <Package className="size-4" />,
  dispatched: <Truck className="size-4" />,
  invoiced: <CheckCircle className="size-4" />,
}

export default function MfgPortalHomePage() {
  const [orders, setOrders]  = React.useState<OrderRow[]>([])
  const [isLoading, setLoad] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setLoad(true)
      const res = await apiCall<{ items: OrderRow[] }>('/api/mfg-portal/orders', undefined, { fallback: { items: [] } })
      if (res.ok) setOrders(res.result?.items ?? [])
      setLoad(false)
    }
    load()
  }, [])

  const activeOrders  = orders.filter((o) => !['invoiced', 'cancelled'].includes(o.status))
  const totalPending  = activeOrders.reduce((s, o) => s + Number(o.total_usd), 0)
  const coaRequired   = activeOrders.filter((o) => o.requires_coa)

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-muted/30 rounded-xl animate-pulse" />)}
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      {/* Welcome summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Pedidos activos</p>
          <p className="text-2xl font-bold">{activeOrders.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Monto en curso</p>
          <p className="text-2xl font-bold">USD {totalPending.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* CoA alert */}
      {coaRequired.length > 0 && (
        <div className="p-3 bg-status-info-bg border border-status-info-border rounded-lg flex items-center gap-2">
          <FileText className="size-4 text-status-info-icon shrink-0" />
          <span className="text-sm">
            {coaRequired.length} pedido(s) requieren Certificado de Análisis para la recepción.
            <a href="./certificados" className="ml-1 underline font-medium">Ver certificados →</a>
          </span>
        </div>
      )}

      {/* Orders list */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Mis Pedidos</h2>
        {orders.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <Package className="size-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No tiene pedidos registrados aún.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <div key={o.id} className="border border-border rounded-xl p-4 bg-card">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="font-mono font-semibold">{o.order_number}</span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(o.created_at).toLocaleDateString('es-VE')}
                      {o.scheduled_dispatch_date && ` · Despacho: ${new Date(o.scheduled_dispatch_date).toLocaleDateString('es-VE')}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {STATUS_ICON[o.status]}
                    <StatusBadge variant={STATUS_VARIANT[o.status] ?? 'neutral'} dot>
                      {STATUS_LABEL[o.status] ?? o.status}
                    </StatusBadge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold">USD {Number(o.total_usd).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                  <div className="flex items-center gap-2">
                    {o.requires_coa && (
                      <a href="./certificados" className="text-xs text-primary underline flex items-center gap-1">
                        <FileText className="size-3" /> CoA
                      </a>
                    )}
                    {o.status === 'invoiced' && o.actual_dispatch_date && (
                      <span className="text-xs text-status-success-text">
                        Recibido: {new Date(o.actual_dispatch_date).toLocaleDateString('es-VE')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
