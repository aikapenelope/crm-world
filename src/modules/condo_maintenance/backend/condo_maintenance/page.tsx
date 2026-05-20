'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, Truck, ClipboardList } from 'lucide-react'

type RequestRow = {
  id: string
  request_number: string
  title: string
  category: string
  priority: string
  status: string
  assigned_to: string | null
  created_at: string
}

type DashboardData = {
  requests: { open: number; in_progress: number; completed: number; emergencies: number; total: number }
  work_orders: { pending: number; total: number }
  costs: { total: string; currency: string }
}

export default function CondoMaintenancePage() {
  const router = useRouter()
  const [requests, setRequests] = React.useState<RequestRow[]>([])
  const [dashboard, setDashboard] = React.useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const [reqRes, dashRes] = await Promise.all([
        apiCall<{ items: RequestRow[] }>('/api/condo-maintenance/requests?pageSize=100', undefined, { fallback: { items: [] } }),
        apiCall<DashboardData>('/api/condo-maintenance/dashboard', undefined, { fallback: null }),
      ])
      if (reqRes.ok) setRequests(reqRes.result?.items ?? [])
      if (dashRes.ok && dashRes.result) setDashboard(dashRes.result)
      setIsLoading(false)
    }
    load()
  }, [])

  const categoryLabels: Record<string, string> = {
    plumbing: 'Plomería', electrical: 'Electricidad', elevator: 'Ascensor',
    structural: 'Estructura', cleaning: 'Limpieza', security: 'Seguridad',
    garden: 'Jardín', pool: 'Piscina', other: 'Otro',
  }

  const priorityVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    low: 'secondary', medium: 'outline', high: 'default', emergency: 'destructive',
  }

  const statusLabels: Record<string, string> = {
    open: 'Abierta', assigned: 'Asignada', in_progress: 'En Progreso',
    completed: 'Completada', cancelled: 'Cancelada',
  }

  const columns: ColumnDef<RequestRow>[] = [
    {
      accessorKey: 'request_number',
      header: '#',
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.request_number}</span>,
    },
    { accessorKey: 'title', header: 'Título' },
    {
      accessorKey: 'category',
      header: 'Categoría',
      cell: ({ row }) => categoryLabels[row.original.category] ?? row.original.category,
    },
    {
      accessorKey: 'priority',
      header: 'Prioridad',
      cell: ({ row }) => (
        <Badge variant={priorityVariants[row.original.priority] ?? 'secondary'}>
          {row.original.priority}
        </Badge>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => statusLabels[row.original.status] ?? row.original.status,
    },
    {
      accessorKey: 'assigned_to',
      header: 'Asignado',
      cell: ({ row }) => row.original.assigned_to ?? '—',
    },
  ]

  return (
    <Page>
      <PageBody>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Mantenimiento</h1>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => router.push('/backend/condo_maintenance/work-orders')}>
              <ClipboardList className="mr-2 size-4" />
              Órdenes
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => router.push('/backend/condo_maintenance/suppliers')}>
              <Truck className="mr-2 size-4" />
              Proveedores
            </Button>
            <Button type="button" onClick={() => router.push('/backend/condo_maintenance/requests/create')}>
              <Plus className="mr-2 size-4" />
              Nueva Solicitud
            </Button>
          </div>
        </div>

        {dashboard && (
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-5">
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Abiertas</p>
              <p className="text-lg font-bold">{dashboard.requests.open}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">En Progreso</p>
              <p className="text-lg font-bold">{dashboard.requests.in_progress}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Completadas</p>
              <p className="text-lg font-bold">{dashboard.requests.completed}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Emergencias</p>
              <p className={`text-lg font-bold ${dashboard.requests.emergencies > 0 ? 'text-destructive' : ''}`}>
                {dashboard.requests.emergencies}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Costo Total</p>
              <p className="text-lg font-bold">{dashboard.costs.currency} {Number(dashboard.costs.total).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        )}

        <DataTable
          columns={columns}
          data={requests}
          isLoading={isLoading}
          searchPlaceholder="Buscar solicitud..."
        />
      </PageBody>
    </Page>
  )
}
