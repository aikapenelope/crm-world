'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, Calendar } from 'lucide-react'

type RouteRow = {
  id: string
  name: string
  code: string
  zone: string | null
  day_of_week: number | null
  assigned_seller_id: string | null
  vehicle_plate: string | null
  is_active: boolean
}

const DAY_LABELS: Record<number, string> = {
  0: 'Domingo',
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
}

export default function DistRoutesPage() {
  const router = useRouter()
  const [routes, setRoutes] = React.useState<RouteRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const call = await apiCall<{ items: RouteRow[] }>(
        '/api/dist-routes/routes?pageSize=100',
        undefined,
        { fallback: { items: [] } },
      )
      if (call.ok) {
        setRoutes(call.result?.items ?? [])
      }
      setIsLoading(false)
    }
    load()
  }, [])

  const columns: ColumnDef<RouteRow>[] = [
    {
      accessorKey: 'name',
      header: 'Nombre',
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: 'code',
      header: 'Código',
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.code}</span>,
    },
    {
      accessorKey: 'zone',
      header: 'Zona',
      cell: ({ row }) => row.original.zone ?? '—',
    },
    {
      accessorKey: 'day_of_week',
      header: 'Día',
      cell: ({ row }) => row.original.day_of_week != null
        ? <Badge variant="outline">{DAY_LABELS[row.original.day_of_week] ?? '—'}</Badge>
        : '—',
    },
    {
      accessorKey: 'vehicle_plate',
      header: 'Vehículo',
      cell: ({ row }) => row.original.vehicle_plate ?? '—',
    },
    {
      accessorKey: 'is_active',
      header: 'Estado',
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? 'default' : 'secondary'}>
          {row.original.is_active ? 'Activa' : 'Inactiva'}
        </Badge>
      ),
    },
  ]

  return (
    <Page>
      <PageBody>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Rutas de Distribución</h1>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => router.push('/backend/dist_routes/today')}>
              <Calendar className="mr-2 size-4" />
              Mi Día
            </Button>
            <Button type="button" onClick={() => router.push('/backend/dist_routes/create')}>
              <Plus className="mr-2 size-4" />
              Nueva Ruta
            </Button>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={routes}
          isLoading={isLoading}
          searchPlaceholder="Buscar ruta..."
        />
      </PageBody>
    </Page>
  )
}
