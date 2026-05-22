'use client'

import * as React from 'react'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'

type Props = { params: { orgSlug: string } }


type VehicleStatus = {
  order_id: string
  order_number: string
  status: string
  received_at: string
  customer_complaint: string | null
  estimated_completion: string | null
  total_amount: string
  currency: string
}

const STATUS_LABELS: Record<string, string> = {
  received: 'Recibido en taller',
  diagnosis: 'En diagnóstico',
  estimate_sent: 'Presupuesto enviado',
  approved: 'Trabajo aprobado',
  in_repair: 'En reparación',
  quality_check: 'Control de calidad',
  ready: 'Listo para retirar',
  delivered: 'Entregado',
  no_active_order: 'Sin orden activa',
}

export default function PortalVehiclePage({ params }: Props) {
  const [data, setData] = React.useState<VehicleStatus | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const call = await apiCall<VehicleStatus>(
        '/api/auto-portal/status?vehicle_id=self',
        undefined,
        { fallback: null as any },
      )
      if (call.ok && call.result) { setData(call.result) }
      setIsLoading(false)
    }
    load()
  }, [])

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Cargando...</div>

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Estado de Mi Vehículo</h1>

      {data ? (
        <div className="space-y-4">
          <div className="rounded-lg border p-6 text-center">
            <p className="text-xs text-muted-foreground mb-2">Estado actual</p>
            <Badge variant="default" className="text-lg px-4 py-2">
              {STATUS_LABELS[data.status] ?? data.status}
            </Badge>
          </div>

          {data.order_number && (
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Orden</span>
                <span className="font-mono font-bold">{data.order_number}</span>
              </div>
              {data.customer_complaint && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Motivo</span>
                  <span className="text-sm">{data.customer_complaint}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Ingreso</span>
                <span className="text-sm">{new Date(data.received_at).toLocaleDateString('es-VE')}</span>
              </div>
              {data.estimated_completion && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Entrega estimada</span>
                  <span className="text-sm font-medium">{new Date(data.estimated_completion).toLocaleDateString('es-VE')}</span>
                </div>
              )}
              {Number(data.total_amount) > 0 && (
                <div className="flex justify-between border-t pt-3">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="font-bold">{data.currency} {Number(data.total_amount).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg border p-8 text-center">
          <p className="text-muted-foreground">No hay órdenes activas para su vehículo.</p>
        </div>
      )}
    </div>
  )
}
