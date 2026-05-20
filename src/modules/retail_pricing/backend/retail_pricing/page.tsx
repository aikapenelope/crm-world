'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import { DollarSign, AlertTriangle, TrendingUp, RefreshCw } from 'lucide-react'

type Alert = {
  id: string
  product_id: string
  alert_type: string
  status: string
  current_price: string | null
  cost: string | null
  current_margin: string | null
  message: string | null
  created_at: string
}

const alertTypeLabels: Record<string, string> = {
  below_cost: 'Bajo Costo',
  below_margin: 'Bajo Margen',
  above_regulated: 'Sobre Regulado',
  exchange_rate_drift: 'Desfase Tasa',
}

export default function RetailPricingPage() {
  const router = useRouter()
  const [alerts, setAlerts] = React.useState<Alert[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [showBulkUpdate, setShowBulkUpdate] = React.useState(false)
  const [oldRate, setOldRate] = React.useState('')
  const [newRate, setNewRate] = React.useState('')
  const [isUpdating, setIsUpdating] = React.useState(false)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const call = await apiCall<{ items: Alert[] }>(
        '/api/retail-pricing/alerts?status=active&pageSize=50',
        undefined,
        { fallback: { items: [] } },
      )
      if (call.ok) {
        setAlerts(call.result?.items ?? [])
      }
      setIsLoading(false)
    }
    load()
  }, [])

  async function executeBulkUpdate() {
    if (!oldRate || !newRate) return
    setIsUpdating(true)
    const call = await apiCall('/api/retail-pricing/bulk-update', {
      method: 'POST',
      body: JSON.stringify({
        update_type: 'exchange_rate',
        old_exchange_rate: oldRate,
        new_exchange_rate: newRate,
      }),
    })
    if (call.ok) {
      const result = call.result as any
      flash(`Precios actualizados: ${result.products_affected} productos afectados`, 'success')
      setShowBulkUpdate(false)
      setOldRate('')
      setNewRate('')
    } else {
      flash('Error al actualizar precios', 'error')
    }
    setIsUpdating(false)
  }

  return (
    <Page>
      <PageBody>
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Pricing y Márgenes</h1>
              <p className="text-sm text-muted-foreground">
                {alerts.length} alerta{alerts.length !== 1 ? 's' : ''} activa{alerts.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => router.push('/backend/retail_pricing/rules')}>
              <TrendingUp className="mr-2 size-4" />
              Reglas de Margen
            </Button>
            <Button type="button" onClick={() => setShowBulkUpdate(!showBulkUpdate)}>
              <RefreshCw className="mr-2 size-4" />
              Actualizar por Dólar
            </Button>
          </div>
        </div>

        {/* Bulk Update Panel */}
        {showBulkUpdate && (
          <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 p-4">
            <h3 className="font-semibold mb-3">Actualización Masiva por Tasa de Cambio</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Recalcula todos los precios proporcionalmente al cambio en la tasa USD/VES.
            </p>
            <div className="flex items-end gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tasa Anterior</label>
                <input
                  type="number"
                  value={oldRate}
                  onChange={(e) => setOldRate(e.target.value)}
                  className="w-40 rounded-md border px-3 py-2 text-sm"
                  placeholder="36.50"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tasa Nueva</label>
                <input
                  type="number"
                  value={newRate}
                  onChange={(e) => setNewRate(e.target.value)}
                  className="w-40 rounded-md border px-3 py-2 text-sm"
                  placeholder="38.20"
                  step="0.01"
                />
              </div>
              {oldRate && newRate && (
                <div className="text-sm">
                  <Badge variant="outline">
                    {((Number(newRate) / Number(oldRate) - 1) * 100).toFixed(1)}% de ajuste
                  </Badge>
                </div>
              )}
              <Button type="button" onClick={executeBulkUpdate} disabled={isUpdating || !oldRate || !newRate}>
                {isUpdating ? 'Actualizando...' : 'Ejecutar'}
              </Button>
            </div>
          </div>
        )}

        {/* Active Alerts */}
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="size-5 text-destructive" />
            Alertas de Precio
          </h2>

          {isLoading ? (
            <p className="text-muted-foreground text-sm">Cargando...</p>
          ) : alerts.length === 0 ? (
            <div className="rounded-lg border p-6 text-center">
              <p className="text-muted-foreground">No hay alertas activas. Todos los precios están dentro de los márgenes.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="size-4 text-destructive" />
                    <div>
                      <span className="font-mono text-xs">{alert.product_id.slice(0, 8)}...</span>
                      <p className="text-sm text-muted-foreground">{alert.message}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">{alertTypeLabels[alert.alert_type] ?? alert.alert_type}</Badge>
                    {alert.current_margin && (
                      <span className="text-xs text-destructive font-mono">{alert.current_margin}%</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PageBody>
    </Page>
  )
}
