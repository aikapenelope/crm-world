'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import { Package, AlertTriangle, TrendingDown, ClipboardList } from 'lucide-react'

type Dashboard = {
  total_products: number
  total_units: number
  low_stock_alerts: number
  dead_stock_count: number
  pending_counts: number
  branch_count: number
}

export default function RetailInventoryPage() {
  const router = useRouter()
  const [data, setData] = React.useState<Dashboard | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const call = await apiCall<Dashboard>(
        '/api/retail-inventory/dashboard',
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

  if (isLoading) {
    return (
      <Page><PageBody><div className="text-center py-8 text-muted-foreground">Cargando...</div></PageBody></Page>
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
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Inventario Retail</h1>
              <p className="text-sm text-muted-foreground">
                {data.branch_count} sucursal{data.branch_count !== 1 ? 'es' : ''} con inventario
              </p>
            </div>
          </div>
          <Button type="button" onClick={() => router.push('/backend/retail_inventory/counts/create')}>
            <ClipboardList className="mr-2 size-4" />
            Nuevo Conteo
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="size-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Total Productos</p>
            </div>
            <p className="text-2xl font-bold">{data.total_products.toLocaleString('es-VE')}</p>
            <p className="text-xs text-muted-foreground">{data.total_units.toLocaleString('es-VE')} unidades</p>
          </div>

          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="size-4 text-destructive" />
              <p className="text-xs text-muted-foreground">Stock Bajo</p>
            </div>
            <p className={`text-2xl font-bold ${data.low_stock_alerts > 0 ? 'text-destructive' : ''}`}>
              {data.low_stock_alerts}
            </p>
            <p className="text-xs text-muted-foreground">productos bajo mínimo</p>
          </div>

          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="size-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Sin Movimiento</p>
            </div>
            <p className={`text-2xl font-bold ${data.dead_stock_count > 0 ? 'text-destructive' : ''}`}>
              {data.dead_stock_count}
            </p>
            <p className="text-xs text-muted-foreground">90+ días sin venta</p>
          </div>

          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-2">
              <ClipboardList className="size-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Conteos Pendientes</p>
            </div>
            <p className="text-2xl font-bold">{data.pending_counts}</p>
            <p className="text-xs text-muted-foreground">planificados o en progreso</p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => router.push('/backend/retail_inventory/counts')}
            className="rounded-lg border p-4 text-left hover:bg-muted/50 transition-colors"
          >
            <h3 className="font-semibold mb-1">Conteos Cíclicos</h3>
            <p className="text-sm text-muted-foreground">Planificar y ejecutar conteos de inventario</p>
          </button>
          <button
            type="button"
            onClick={() => router.push('/backend/retail_inventory/rotation')}
            className="rounded-lg border p-4 text-left hover:bg-muted/50 transition-colors"
          >
            <h3 className="font-semibold mb-1">Rotación</h3>
            <p className="text-sm text-muted-foreground">Análisis de rotación por producto y sucursal</p>
          </button>
          <button
            type="button"
            onClick={() => router.push('/backend/retail_inventory/dead-stock')}
            className="rounded-lg border p-4 text-left hover:bg-muted/50 transition-colors"
          >
            <h3 className="font-semibold mb-1">Dead Stock</h3>
            <p className="text-sm text-muted-foreground">Productos sin movimiento que ocupan espacio</p>
          </button>
        </div>
      </PageBody>
    </Page>
  )
}
