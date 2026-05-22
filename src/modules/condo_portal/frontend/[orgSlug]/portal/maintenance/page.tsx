'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import { ArrowLeft, Plus } from 'lucide-react'

type Props = { params: { orgSlug: string } }


type MaintenanceRequest = {
  id: string
  request_number: string
  title: string
  category: string
  priority: string
  status: string
  created_at: string
  assigned_to: string | null
}

const STATUS_LABELS: Record<string, string> = {
  open: 'Abierta', assigned: 'Asignada', in_progress: 'En progreso',
  completed: 'Completada', cancelled: 'Cancelada',
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  open: 'outline', assigned: 'outline', in_progress: 'default',
  completed: 'secondary', cancelled: 'secondary',
}

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Baja', medium: 'Media', high: 'Alta', emergency: 'Emergencia',
}

const CATEGORY_LABELS: Record<string, string> = {
  plumbing: 'Plomería', electrical: 'Electricidad', elevator: 'Ascensor',
  structural: 'Estructura', cleaning: 'Limpieza', security: 'Seguridad',
  garden: 'Jardines', pool: 'Piscina', other: 'Otro',
}

export default function PortalMaintenancePage({ params }: Props) {
  const router = useRouter()
  const [requests, setRequests] = React.useState<MaintenanceRequest[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [unitId, setUnitId] = React.useState<string | null>(null)
  const [buildingId, setBuildingId] = React.useState<string | null>(null)

  React.useEffect(() => {
    const url = new URL(window.location.href)
    const uid = url.searchParams.get('unit_id') ?? ''
    const bid = url.searchParams.get('building_id') ?? ''
    setUnitId(uid)
    setBuildingId(bid)
    if (!uid && !bid) { setIsLoading(false); return }

    async function load() {
      setIsLoading(true)
      const params = uid ? `unit_id=${uid}` : `building_id=${bid}`
      const res = await apiCall<{ items: MaintenanceRequest[] }>(
        `/api/condo-portal/maintenance-list?${params}`,
        undefined,
        { fallback: { items: [] } },
      )
      if (res.ok) setRequests(res.result?.items ?? [])
      setIsLoading(false)
    }
    load()
  }, [])

  const dashboardUrl = unitId ? `/${params.orgSlug}/portal/dashboard?unit_id=${unitId}` : `/${params.orgSlug}/portal/dashboard`
  const createUrl = unitId
    ? `/${params.orgSlug}/portal/maintenance/create?unit_id=${unitId}${buildingId ? `&building_id=${buildingId}` : ''}`
    : `/${params.orgSlug}/portal/maintenance/create`

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button type="button" variant="ghost" size="sm" onClick={() => router.push(dashboardUrl)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Inicio
          </Button>
          <h1 className="text-xl font-bold">Mantenimiento</h1>
        </div>
        <Button type="button" size="sm" onClick={() => router.push(createUrl)}>
          <Plus className="mr-2 size-4" />
          Nueva solicitud
        </Button>
      </div>

      {isLoading && (
        <div className="text-center py-8 text-muted-foreground">Cargando solicitudes...</div>
      )}

      {!isLoading && requests.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-3">No hay solicitudes de mantenimiento.</p>
          <Button type="button" variant="outline" size="sm" onClick={() => router.push(createUrl)}>
            <Plus className="mr-2 size-4" />
            Crear primera solicitud
          </Button>
        </div>
      )}

      {requests.length > 0 && (
        <div className="space-y-3">
          {requests.map(req => (
            <div key={req.id} className="rounded-lg border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-mono text-xs text-muted-foreground">{req.request_number}</span>
                    <Badge variant={req.priority === 'emergency' ? 'destructive' : 'outline'} className="text-xs">
                      {PRIORITY_LABELS[req.priority] ?? req.priority}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {CATEGORY_LABELS[req.category] ?? req.category}
                    </Badge>
                  </div>
                  <p className="font-medium text-sm">{req.title}</p>
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(req.created_at).toLocaleDateString('es-VE', { day: 'numeric', month: 'long', year: 'numeric' })}
                    {req.assigned_to && ` · Técnico: ${req.assigned_to}`}
                  </div>
                </div>
                <Badge variant={STATUS_VARIANTS[req.status] ?? 'outline'} className="text-xs shrink-0">
                  {STATUS_LABELS[req.status] ?? req.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
