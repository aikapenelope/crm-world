'use client'

import * as React from 'react'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { LayoutGrid } from 'lucide-react'
import { useT } from '@open-mercato/shared/lib/i18n/context'

type OrderRow = {
  id: string
  order_number: string
  status: string
  customer_complaint: string | null
  priority: string
  received_at: string
}

const BOARD_COLUMNS = [
  { key: 'received', label: 'Recibido', color: 'border-muted-foreground/30' },
  { key: 'diagnosis', label: 'Diagnóstico', color: 'border-muted-foreground/30' },
  { key: 'approved', label: 'Aprobado', color: 'border-primary/30' },
  { key: 'in_repair', label: 'En Reparación', color: 'border-primary/30' },
  { key: 'ready', label: 'Listo', color: 'border-primary/50' },
]

const PRIORITY_DOTS: Record<string, string> = {
  urgent: 'bg-destructive',
  high: 'bg-foreground',
  normal: 'bg-muted-foreground',
  low: 'bg-muted-foreground/50',
}

export default function ServiceOrderBoardPage() {
  const t = useT()
  const [orders, setOrders] = React.useState<OrderRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const call = await apiCall<{ items: OrderRow[] }>(
        '/api/auto-service-orders/orders?pageSize=200',
        undefined,
        { fallback: { items: [] } },
      )
      if (call.ok) { setOrders(call.result?.items ?? []) }
      setIsLoading(false)
    }
    load()
  }, [])

  const ordersByStatus = React.useMemo(() => {
    const map = new Map<string, OrderRow[]>()
    for (const col of BOARD_COLUMNS) {
      map.set(col.key, orders.filter((o) => o.status === col.key))
    }
    return map
  }, [orders])

  if (isLoading) {
    return (
      <Page>
        <PageBody>
          <div className="text-center py-8 text-muted-foreground">
            {t('auto_service_orders.board.loading', 'Cargando board...')}
          </div>
        </PageBody>
      </Page>
    )
  }

  return (
    <Page>
      <PageBody>
        <div className="mb-6 flex items-center gap-3">
          <LayoutGrid className="size-5 text-muted-foreground" />
          <h1 className="text-2xl font-bold">{t('auto_service_orders.board.title', 'Board — Vehículos en Taller')}</h1>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          {BOARD_COLUMNS.map((col) => {
            const colOrders = ordersByStatus.get(col.key) ?? []
            return (
              <div key={col.key} className={`rounded-lg border-2 ${col.color} p-3`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">{col.label}</h3>
                  <Badge variant="outline">{colOrders.length}</Badge>
                </div>
                <div className="space-y-2">
                  {colOrders.map((order) => (
                    <div key={order.id} className="rounded-md border bg-background p-3 shadow-xs">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`size-2 rounded-full ${PRIORITY_DOTS[order.priority] ?? 'bg-muted-foreground'}`} />
                        <span className="font-mono text-xs font-bold">{order.order_number}</span>
                      </div>
                      {order.customer_complaint && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{order.customer_complaint}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(order.received_at).toLocaleDateString('es-VE')}
                      </p>
                    </div>
                  ))}
                  {colOrders.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      {t('auto_service_orders.board.empty_col', 'Sin órdenes')}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </PageBody>
    </Page>
  )
}
