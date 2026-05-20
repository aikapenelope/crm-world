'use client'

import * as React from 'react'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { MapPin, CheckCircle2, XCircle, ShoppingCart } from 'lucide-react'

type StopWithVisit = {
  stop_id: string
  customer_id: string
  customer_name: string
  address: string | null
  contact_phone: string | null
  sequence_order: number
  visit_status: string | null
}

const STATUS_LABELS: Record<string, string> = {
  planned: 'Planificada',
  visited: 'Visitado',
  skipped: 'Omitido',
  order_taken: 'Pedido tomado',
  no_order: 'Sin pedido',
}

export default function TodayRoutePage() {
  const [stops, setStops] = React.useState<StopWithVisit[]>([])
  const [routeName, setRouteName] = React.useState<string>('')
  const [isLoading, setIsLoading] = React.useState(true)

  const today = new Date()
  const dayOfWeek = today.getDay()

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      // Get routes for today's day of week
      const routesCall = await apiCall<{ items: any[] }>(
        `/api/dist-routes/routes?day_of_week=${dayOfWeek}&pageSize=1`,
        undefined,
        { fallback: { items: [] } },
      )

      if (routesCall.ok && routesCall.result?.items?.[0]) {
        const route = routesCall.result.items[0]
        setRouteName(route.name)

        // Get stops for this route
        const stopsCall = await apiCall<{ items: any[] }>(
          `/api/dist-routes/stops?route_id=${route.id}&pageSize=100`,
          undefined,
          { fallback: { items: [] } },
        )

        if (stopsCall.ok) {
          const stopsData = (stopsCall.result?.items ?? []).map((s: any) => ({
            stop_id: s.id,
            customer_id: s.customer_id,
            customer_name: s.customer_id.slice(0, 8) + '...',
            address: s.address,
            contact_phone: s.contact_phone,
            sequence_order: s.sequence_order,
            visit_status: null,
          }))
          setStops(stopsData.sort((a: any, b: any) => a.sequence_order - b.sequence_order))
        }
      }
      setIsLoading(false)
    }
    load()
  }, [dayOfWeek])

  const markVisit = async (stopId: string, status: string) => {
    // In a real implementation, this would create/update a visit record
    setStops((prev) => prev.map((s) => s.stop_id === stopId ? { ...s, visit_status: status } : s))
    flash(`Visita marcada: ${STATUS_LABELS[status] ?? status}`, 'success')
  }

  const completedCount = stops.filter((s) => s.visit_status && s.visit_status !== 'planned').length

  return (
    <Page>
      <PageBody>
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Mi Día — {routeName || 'Sin ruta'}</h1>
            <p className="text-sm text-muted-foreground">
              {today.toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long' })}
              {' · '}{completedCount}/{stops.length} paradas
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Cargando ruta del día...</div>
        ) : stops.length === 0 ? (
          <div className="rounded-lg border p-8 text-center">
            <p className="text-muted-foreground">No hay ruta asignada para hoy.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {stops.map((stop, idx) => (
              <div key={stop.stop_id} className={`rounded-lg border p-4 ${stop.visit_status ? 'bg-muted/30' : ''}`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold">
                      {idx + 1}
                    </div>
                    <div>
                      <span className="font-medium">{stop.customer_name}</span>
                      {stop.address && <p className="text-xs text-muted-foreground">{stop.address}</p>}
                      {stop.contact_phone && <p className="text-xs text-muted-foreground">{stop.contact_phone}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {stop.visit_status ? (
                      <Badge variant={stop.visit_status === 'order_taken' ? 'default' : 'secondary'}>
                        {STATUS_LABELS[stop.visit_status] ?? stop.visit_status}
                      </Badge>
                    ) : (
                      <>
                        <Button type="button" size="sm" variant="outline" onClick={() => markVisit(stop.stop_id, 'no_order')}>
                          <XCircle className="mr-1 size-3" />
                          Sin pedido
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => markVisit(stop.stop_id, 'visited')}>
                          <CheckCircle2 className="mr-1 size-3" />
                          Visitado
                        </Button>
                        <Button type="button" size="sm" onClick={() => markVisit(stop.stop_id, 'order_taken')}>
                          <ShoppingCart className="mr-1 size-3" />
                          Pedido
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </PageBody>
    </Page>
  )
}
