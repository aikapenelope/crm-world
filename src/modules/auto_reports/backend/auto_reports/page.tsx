'use client'

import * as React from 'react'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Car, Wrench, DollarSign, Package } from 'lucide-react'

type Dashboard = { vehicles_in_shop: number; orders_completed: number; total_revenue: string; total_orders: number; parts_low_stock: number; total_parts: number }

export default function AutoReportsPage() {
  const [data, setData] = React.useState<Dashboard | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const call = await apiCall<Dashboard>('/api/auto-reports/dashboard', undefined, { fallback: null as any })
      if (call.ok && call.result) { setData(call.result) }
      setIsLoading(false)
    }
    load()
  }, [])

  if (isLoading || !data) return <Page><PageBody><div className="text-center py-8 text-muted-foreground">Cargando...</div></PageBody></Page>

  return (
    <Page>
      <PageBody>
        <h1 className="text-2xl font-bold mb-6">Reportes del Taller</h1>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-2"><Car className="size-4 text-muted-foreground" /><p className="text-xs text-muted-foreground">Vehículos en Taller</p></div>
            <p className="text-2xl font-bold">{data.vehicles_in_shop}</p>
          </div>
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-2"><Wrench className="size-4 text-muted-foreground" /><p className="text-xs text-muted-foreground">Órdenes Completadas</p></div>
            <p className="text-2xl font-bold">{data.orders_completed}</p>
          </div>
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-2"><DollarSign className="size-4 text-muted-foreground" /><p className="text-xs text-muted-foreground">Ingresos Totales</p></div>
            <p className="text-2xl font-bold">USD {Number(data.total_revenue).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Total Órdenes</p>
            <p className="text-2xl font-bold">{data.total_orders}</p>
          </div>
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-2"><Package className="size-4 text-muted-foreground" /><p className="text-xs text-muted-foreground">Repuestos</p></div>
            <p className="text-2xl font-bold">{data.total_parts}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Repuestos Bajo Mínimo</p>
            <p className={`text-2xl font-bold ${data.parts_low_stock > 0 ? 'text-destructive' : ''}`}>{data.parts_low_stock}</p>
          </div>
        </div>
      </PageBody>
    </Page>
  )
}
