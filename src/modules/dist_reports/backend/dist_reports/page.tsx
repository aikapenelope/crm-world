'use client'

import * as React from 'react'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { PieChart, DollarSign, Package, Truck, MapPin } from 'lucide-react'

type Dashboard = {
  accounts_receivable: { total_receivable: string; total_clients: number; blocked_clients: number }
  inventory: { total_value: string; total_products: number; low_stock_alerts: number }
  deliveries: { total: number; completed: number; completion_rate: number; total_returned: number }
  routes: { total_visits: number; orders_taken: number; effectiveness: number }
}

export default function DistReportsPage() {
  const [data, setData] = React.useState<Dashboard | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const call = await apiCall<Dashboard>(
        '/api/dist-reports/dashboard',
        undefined,
        { fallback: null as any },
      )
      if (call.ok && call.result) {
        setData(call.result)
      }
      setIsLoading(false)
    }
    load()
  }, [])

  const fmt = (val: string | number) => Number(val).toLocaleString('es-VE', { minimumFractionDigits: 2 })

  if (isLoading) {
    return (
      <Page><PageBody><div className="text-center py-8 text-muted-foreground">Cargando reportes...</div></PageBody></Page>
    )
  }

  if (!data) {
    return (
      <Page><PageBody><div className="text-center py-8 text-muted-foreground">No hay datos disponibles.</div></PageBody></Page>
    )
  }

  return (
    <Page>
      <PageBody>
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <PieChart className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Reportes de Distribución</h1>
            <p className="text-sm text-muted-foreground">KPIs del negocio en tiempo real</p>
          </div>
        </div>

        {/* Accounts Receivable */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="size-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Cuentas por Cobrar</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Total por Cobrar</p>
              <p className="text-2xl font-bold">USD {fmt(data.accounts_receivable.total_receivable)}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Clientes con Crédito</p>
              <p className="text-2xl font-bold">{data.accounts_receivable.total_clients}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Clientes Bloqueados</p>
              <p className={`text-2xl font-bold ${data.accounts_receivable.blocked_clients > 0 ? 'text-destructive' : ''}`}>
                {data.accounts_receivable.blocked_clients}
              </p>
            </div>
          </div>
        </div>

        {/* Inventory */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Package className="size-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Inventario</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Valor del Inventario</p>
              <p className="text-2xl font-bold">USD {fmt(data.inventory.total_value)}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Productos en Stock</p>
              <p className="text-2xl font-bold">{data.inventory.total_products}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Alertas Stock Bajo</p>
              <p className={`text-2xl font-bold ${data.inventory.low_stock_alerts > 0 ? 'text-destructive' : ''}`}>
                {data.inventory.low_stock_alerts}
              </p>
            </div>
          </div>
        </div>

        {/* Deliveries */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Truck className="size-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Entregas</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Total Despachos</p>
              <p className="text-2xl font-bold">{data.deliveries.total}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Completados</p>
              <p className="text-2xl font-bold text-primary">{data.deliveries.completed}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Tasa de Entrega</p>
              <p className="text-2xl font-bold">{data.deliveries.completion_rate}%</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Devoluciones</p>
              <p className={`text-2xl font-bold ${data.deliveries.total_returned > 0 ? 'text-destructive' : ''}`}>
                {data.deliveries.total_returned}
              </p>
            </div>
          </div>
        </div>

        {/* Routes */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="size-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Rutas</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Total Visitas</p>
              <p className="text-2xl font-bold">{data.routes.total_visits}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Pedidos Tomados</p>
              <p className="text-2xl font-bold text-primary">{data.routes.orders_taken}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Efectividad</p>
              <p className="text-2xl font-bold">
                {data.routes.effectiveness}%
                <Badge variant={data.routes.effectiveness >= 50 ? 'default' : 'destructive'} className="ml-2 text-xs">
                  {data.routes.effectiveness >= 50 ? 'Buena' : 'Baja'}
                </Badge>
              </p>
            </div>
          </div>
        </div>
      </PageBody>
    </Page>
  )
}
