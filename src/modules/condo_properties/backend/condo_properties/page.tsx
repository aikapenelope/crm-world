'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, Building2, AlertTriangle } from 'lucide-react'

type BuildingRow = {
  id: string
  name: string
  code: string
  building_type: string
  city: string | null
  total_units: number
  is_active: boolean
}

type DashboardData = {
  buildings: { total: number; active: number }
  units: { total: number; occupied: number; vacant: number; occupancy_rate: number }
  aliquot_warnings: { building_id: string; building_name: string; total_aliquot: number }[]
  common_areas: { total: number; reservable: number }
}

export default function CondoPropertiesPage() {
  const router = useRouter()
  const [buildings, setBuildings] = React.useState<BuildingRow[]>([])
  const [dashboard, setDashboard] = React.useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const [buildingsRes, dashRes] = await Promise.all([
        apiCall<{ items: BuildingRow[] }>(
          '/api/condo-properties/buildings?pageSize=100',
          undefined,
          { fallback: { items: [] } },
        ),
        apiCall<DashboardData>(
          '/api/condo-properties/dashboard',
          undefined,
          { fallback: null },
        ),
      ])
      if (buildingsRes.ok) {
        setBuildings(buildingsRes.result?.items ?? [])
      }
      if (dashRes.ok && dashRes.result) {
        setDashboard(dashRes.result)
      }
      setIsLoading(false)
    }
    load()
  }, [])

  const buildingTypeLabels: Record<string, string> = {
    residential: 'Residencial',
    commercial: 'Comercial',
    mixed: 'Mixto',
  }

  const columns: ColumnDef<BuildingRow>[] = [
    {
      accessorKey: 'name',
      header: 'Edificio',
      cell: ({ row }) => (
        <div>
          <span className="font-medium">{row.original.name}</span>
          <span className="ml-2 text-xs text-muted-foreground">{row.original.code}</span>
        </div>
      ),
    },
    {
      accessorKey: 'building_type',
      header: 'Tipo',
      cell: ({ row }) => (
        <Badge variant="outline">
          {buildingTypeLabels[row.original.building_type] ?? row.original.building_type}
        </Badge>
      ),
    },
    {
      accessorKey: 'city',
      header: 'Ciudad',
      cell: ({ row }) => row.original.city ?? '—',
    },
    {
      accessorKey: 'total_units',
      header: 'Unidades',
      cell: ({ row }) => row.original.total_units,
    },
    {
      accessorKey: 'is_active',
      header: 'Estado',
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? 'default' : 'secondary'}>
          {row.original.is_active ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
  ]

  return (
    <Page>
      <PageBody>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Condominios</h1>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => router.push('/backend/condo_properties/units')}>
              <Building2 className="mr-2 size-4" />
              Unidades
            </Button>
            <Button type="button" onClick={() => router.push('/backend/condo_properties/create')}>
              <Plus className="mr-2 size-4" />
              Nuevo Edificio
            </Button>
          </div>
        </div>

        {/* Dashboard Summary */}
        {dashboard && (
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Edificios Activos</p>
              <p className="text-lg font-bold">{dashboard.buildings.active}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Total Unidades</p>
              <p className="text-lg font-bold">{dashboard.units.total}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Ocupación</p>
              <p className="text-lg font-bold">{dashboard.units.occupancy_rate}%</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Áreas Comunes</p>
              <p className="text-lg font-bold">{dashboard.common_areas.total}</p>
            </div>
          </div>
        )}

        {/* Aliquot warnings */}
        {dashboard && dashboard.aliquot_warnings.length > 0 && (
          <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/5 p-3">
            <div className="flex items-center gap-2 text-sm font-medium text-destructive">
              <AlertTriangle className="size-4" />
              Alícuotas no suman 100%
            </div>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              {dashboard.aliquot_warnings.map((w) => (
                <li key={w.building_id}>
                  {w.building_name}: {w.total_aliquot}%
                </li>
              ))}
            </ul>
          </div>
        )}

        <DataTable
          columns={columns}
          data={buildings}
          isLoading={isLoading}
          searchPlaceholder="Buscar edificio..."
          onRowClick={(row) => router.push(`/backend/condo_properties/${row.id}`)}
        />
      </PageBody>
    </Page>
  )
}
