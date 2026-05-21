'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import { LoadingMessage } from '@open-mercato/ui/backend/detail'
import type { ColumnDef } from '@tanstack/react-table'
import { ArrowLeft, Building2, AlertTriangle, Plus } from 'lucide-react'

type Building = {
  id: string
  name: string
  code: string
  building_type: string
  address: string | null
  city: string | null
  state: string | null
  total_units: number
  floors: number | null
  rif: string | null
  admin_company: string | null
  is_active: boolean
}

type Unit = {
  id: string
  unit_number: string
  floor: number | null
  unit_type: string
  area_sqm: string | null
  aliquot_percent: string
  owner_name: string | null
  owner_phone: string | null
  owner_email: string | null
  status: string
  is_occupied: boolean
}

const UNIT_TYPE_LABELS: Record<string, string> = {
  apartment: 'Apartamento', office: 'Oficina', commercial: 'Local comercial',
  parking: 'Estacionamiento', storage: 'Depósito', other: 'Otro',
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Activo', reserved: 'Reservado', unavailable: 'No disponible',
}

export default function CondoBuildingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const buildingId = params?.id as string

  const [building, setBuilding] = React.useState<Building | null>(null)
  const [units, setUnits] = React.useState<Unit[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    if (!buildingId) return
    async function load() {
      setIsLoading(true)
      const [bldRes, unitRes] = await Promise.all([
        apiCall<{ items: Building[] }>(
          `/api/condo-properties/buildings?id=${buildingId}`,
          undefined,
          { fallback: { items: [] } },
        ),
        apiCall<{ items: Unit[] }>(
          `/api/condo-properties/units?building_id=${buildingId}&pageSize=200`,
          undefined,
          { fallback: { items: [] } },
        ),
      ])
      setBuilding(bldRes.result?.items?.[0] ?? null)
      setUnits(unitRes.result?.items ?? [])
      setIsLoading(false)
    }
    load()
  }, [buildingId])

  if (isLoading) return <LoadingMessage label="Cargando edificio..." />
  if (!building) return (
    <Page>
      <PageBody>
        <Button variant="ghost" size="sm" onClick={() => router.push('/backend/condo_properties')}>
          <ArrowLeft className="mr-2 h-4 w-4" />Volver
        </Button>
        <p className="mt-4 text-muted-foreground">Edificio no encontrado.</p>
      </PageBody>
    </Page>
  )

  const totalAliquot = units.reduce((s, u) => s + Number(u.aliquot_percent), 0)
  const aliquotOk = Math.abs(totalAliquot - 100) < 0.01
  const occupied = units.filter(u => u.is_occupied).length
  const occupancyRate = units.length > 0 ? ((occupied / units.length) * 100).toFixed(1) : '0.0'

  const columns: ColumnDef<Unit>[] = [
    { header: 'Unidad', accessorKey: 'unit_number', cell: ({ row }) => <span className="font-medium">{row.original.unit_number}</span> },
    { header: 'Tipo', accessorKey: 'unit_type', cell: ({ row }) => UNIT_TYPE_LABELS[row.original.unit_type] ?? row.original.unit_type },
    { header: 'Piso', accessorKey: 'floor' },
    { header: 'Área m²', accessorKey: 'area_sqm', cell: ({ row }) => row.original.area_sqm ? `${Number(row.original.area_sqm).toFixed(1)} m²` : '—' },
    {
      header: 'Alícuota',
      accessorKey: 'aliquot_percent',
      cell: ({ row }) => <span className="font-mono text-sm">{Number(row.original.aliquot_percent).toFixed(5)}%</span>,
    },
    { header: 'Propietario', accessorKey: 'owner_name', cell: ({ row }) => row.original.owner_name ?? <span className="text-muted-foreground">—</span> },
    {
      header: 'Estado',
      accessorKey: 'status',
      cell: ({ row }) => (
        <Badge variant={row.original.is_occupied ? 'secondary' : 'outline'}>
          {row.original.is_occupied ? 'Ocupado' : 'Libre'}
        </Badge>
      ),
    },
  ]

  return (
    <Page>
      <PageBody>
        {/* Back */}
        <Button variant="ghost" size="sm" onClick={() => router.push('/backend/condo_properties')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Edificios
        </Button>

        {/* Header */}
        <div className="mt-4 mb-6 flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="size-6 text-muted-foreground" />
              <h1 className="text-2xl font-bold">{building.name}</h1>
              <Badge variant="secondary" className="text-xs">{building.code}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {[building.address, building.city, building.state].filter(Boolean).join(', ')}
              {building.admin_company && ` · ${building.admin_company}`}
            </p>
          </div>
          <Button type="button" size="sm" onClick={() => router.push(`/backend/condo_properties/units/create`)}>
            <Plus className="mr-2 size-4" />
            Nueva unidad
          </Button>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="rounded-lg border p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1">Total unidades</div>
            <div className="font-bold text-lg">{units.length}</div>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1">Ocupación</div>
            <div className="font-bold text-lg">{occupancyRate}%</div>
            <div className="text-xs text-muted-foreground">{occupied} / {units.length}</div>
          </div>
          <div className={`rounded-lg border p-3 text-center ${!aliquotOk ? 'border-status-warning-border bg-status-warning-bg' : ''}`}>
            <div className="text-xs text-muted-foreground mb-1">Suma alícuotas</div>
            <div className={`font-bold text-lg ${!aliquotOk ? 'text-status-warning-text' : ''}`}>
              {totalAliquot.toFixed(3)}%
            </div>
            {!aliquotOk && <div className="text-xs text-status-warning-text">≠ 100%</div>}
          </div>
          <div className="rounded-lg border p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1">Pisos</div>
            <div className="font-bold text-lg">{building.floors ?? '—'}</div>
          </div>
        </div>

        {!aliquotOk && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-status-warning-border bg-status-warning-bg px-4 py-2 text-sm text-status-warning-text">
            <AlertTriangle className="size-4 shrink-0" />
            La suma de alícuotas es {totalAliquot.toFixed(5)}% — debe ser exactamente 100%.
          </div>
        )}

        {building.rif && (
          <div className="mb-4 text-sm text-muted-foreground">
            RIF: <span className="font-medium">{building.rif}</span>
          </div>
        )}

        {/* Units table */}
        <h2 className="text-sm font-semibold mb-3">Unidades ({units.length})</h2>
        <DataTable
          columns={columns}
          data={units}
          isLoading={false}
          searchPlaceholder="Buscar unidad o propietario..."
        />
      </PageBody>
    </Page>
  )
}
